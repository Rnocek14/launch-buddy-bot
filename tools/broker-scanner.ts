/**
 * Broker Scanner Worker
 * 
 * Scans data broker sites to detect if user information is exposed.
 * Uses Browserless API for cloud-based Playwright execution.
 * 
 * Environment variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_KEY: Service role key
 * - BROWSERLESS_API_KEY: Browserless.io API key
 * - BROKER_BATCH_SIZE: Number of brokers to scan per run (default: 5)
 * - BROKER_SCAN_TIMEOUT_MS: Timeout per broker scan (default: 30000)
 */

import { chromium, Browser, Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY!;
const BATCH_SIZE = parseInt(process.env.BROKER_BATCH_SIZE || '5', 10);
const SCAN_TIMEOUT = parseInt(process.env.BROKER_SCAN_TIMEOUT_MS || '30000', 10);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Broker {
  id: string;
  name: string;
  slug: string;
  search_url: string;
  priority: string;
}

interface ScanJob {
  scan_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  city: string;
  state: string;
  brokers: Broker[];
}

interface ScanResult {
  broker_id: string;
  status: 'found' | 'clean' | 'error';
  profile_url?: string;
  screenshot_url?: string;
  match_confidence?: number;
  error_message?: string;
}

// Detection patterns for common broker sites
const detectionPatterns: Record<string, {
  noResults: string[];
  hasResults: string[];
}> = {
  beenverified: {
    noResults: ['No records found', 'no results', '0 results'],
    hasResults: ['We found', 'records for', 'View Details'],
  },
  spokeo: {
    noResults: ['No results found', 'no matches'],
    hasResults: ['results for', 'View Results', 'See Details'],
  },
  whitepages: {
    noResults: ['No results', 'not find'],
    hasResults: ['results', 'View Full Report'],
  },
  truepeoplesearch: {
    noResults: ['no results', 'not found'],
    hasResults: ['results for', 'View Free Details'],
  },
  fastpeoplesearch: {
    noResults: ['No results found', 'no matches'],
    hasResults: ['results', 'View Details'],
  },
  default: {
    noResults: ['no results', 'not found', '0 results', 'no matches'],
    hasResults: ['results', 'found', 'view details', 'see profile'],
  },
};

async function connectToBrowser(): Promise<Browser> {
  console.log('Connecting to Browserless...');
  
  const browser = await chromium.connect({
    wsEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`,
  });
  
  console.log('Connected to Browserless');
  return browser;
}

function buildSearchUrl(broker: Broker, job: ScanJob): string {
  // For now, use simple URL construction
  // In production, each broker would have its own URL template
  const searchUrl = broker.search_url || `https://${broker.slug}.com`;
  
  // URL encode the search parameters
  const params = new URLSearchParams({
    name: `${job.first_name} ${job.last_name}`,
    city: job.city,
    state: job.state,
  });
  
  return `${searchUrl}?${params.toString()}`;
}

async function scanBroker(
  page: Page,
  broker: Broker,
  job: ScanJob
): Promise<ScanResult> {
  console.log(`Scanning ${broker.name} for ${job.first_name} ${job.last_name}...`);
  
  try {
    const searchUrl = buildSearchUrl(broker, job);
    
    // Navigate to search page
    await page.goto(searchUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: SCAN_TIMEOUT,
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Get page content
    const pageContent = await page.content();
    const pageText = await page.innerText('body').catch(() => '');
    
    // Get detection patterns for this broker
    const patterns = detectionPatterns[broker.slug] || detectionPatterns.default;
    
    // Check for no results indicators
    const hasNoResults = patterns.noResults.some(
      pattern => pageText.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // Check for results indicators
    const hasResults = patterns.hasResults.some(
      pattern => pageText.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // Check if user's name appears in results
    const nameInResults = pageText.toLowerCase().includes(
      `${job.first_name} ${job.last_name}`.toLowerCase()
    );
    
    // Determine status
    let status: 'found' | 'clean' | 'error' = 'clean';
    let matchConfidence = 0;
    
    if (hasNoResults && !hasResults) {
      status = 'clean';
      matchConfidence = 0.9;
    } else if (hasResults || nameInResults) {
      status = 'found';
      matchConfidence = nameInResults ? 0.85 : 0.6;
    } else {
      // Unclear, mark as clean with low confidence
      status = 'clean';
      matchConfidence = 0.5;
    }
    
    console.log(`${broker.name}: ${status} (confidence: ${matchConfidence})`);
    
    return {
      broker_id: broker.id,
      status,
      profile_url: status === 'found' ? page.url() : undefined,
      match_confidence: matchConfidence,
    };
    
  } catch (error) {
    console.error(`Error scanning ${broker.name}:`, error);
    return {
      broker_id: broker.id,
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function getPendingScans(): Promise<ScanJob[]> {
  // Get scans that are pending or running
  const { data: scans, error: scansError } = await supabase
    .from('broker_scans')
    .select('id, user_id, status')
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);
  
  if (scansError || !scans?.length) {
    console.log('No pending scans found');
    return [];
  }
  
  const jobs: ScanJob[] = [];
  
  for (const scan of scans) {
    // Get user profile for PII
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', scan.user_id)
      .single();
    
    if (!profile?.full_name) {
      console.log(`No profile found for user ${scan.user_id}`);
      continue;
    }
    
    // Parse name (simple split)
    const nameParts = profile.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Get brokers that haven't been scanned yet for this user
    const { data: brokers } = await supabase
      .from('data_brokers')
      .select('id, name, slug, search_url, priority')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(BATCH_SIZE);
    
    if (brokers?.length) {
      jobs.push({
        scan_id: scan.id,
        user_id: scan.user_id,
        first_name: firstName,
        last_name: lastName,
        city: '', // Would come from profile
        state: '', // Would come from profile
        brokers: brokers as Broker[],
      });
    }
  }
  
  return jobs;
}

async function updateScanResult(
  scanId: string,
  userId: string,
  result: ScanResult
): Promise<void> {
  // Upsert the result
  await supabase
    .from('broker_scan_results')
    .upsert({
      user_id: userId,
      broker_id: result.broker_id,
      status: result.status,
      profile_url: result.profile_url,
      screenshot_url: result.screenshot_url,
      match_confidence: result.match_confidence,
      error_message: result.error_message,
      scanned_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    }, {
      onConflict: 'user_id,broker_id',
    });
}

async function updateScanProgress(
  scanId: string,
  scannedCount: number,
  foundCount: number,
  cleanCount: number,
  errorCount: number,
  completed: boolean
): Promise<void> {
  await supabase
    .from('broker_scans')
    .update({
      status: completed ? 'completed' : 'running',
      scanned_count: scannedCount,
      found_count: foundCount,
      clean_count: cleanCount,
      error_count: errorCount,
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', scanId);
}

async function main() {
  console.log('Starting broker scanner...');
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Scan timeout: ${SCAN_TIMEOUT}ms`);
  
  // Get pending scan jobs
  const jobs = await getPendingScans();
  
  if (jobs.length === 0) {
    console.log('No pending scans to process');
    return;
  }
  
  console.log(`Found ${jobs.length} scan jobs to process`);
  
  let browser: Browser | null = null;
  
  try {
    // Connect to Browserless
    browser = await connectToBrowser();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    for (const job of jobs) {
      console.log(`\nProcessing scan ${job.scan_id} for user ${job.user_id}`);
      
      let scannedCount = 0;
      let foundCount = 0;
      let cleanCount = 0;
      let errorCount = 0;
      
      // Mark scan as running
      await supabase
        .from('broker_scans')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString(),
          total_brokers: job.brokers.length,
        })
        .eq('id', job.scan_id);
      
      for (const broker of job.brokers) {
        const page = await context.newPage();
        
        try {
          const result = await scanBroker(page, broker, job);
          await updateScanResult(job.scan_id, job.user_id, result);
          
          scannedCount++;
          if (result.status === 'found') foundCount++;
          else if (result.status === 'clean') cleanCount++;
          else errorCount++;
          
          // Update progress
          await updateScanProgress(
            job.scan_id,
            scannedCount,
            foundCount,
            cleanCount,
            errorCount,
            scannedCount === job.brokers.length
          );
          
        } finally {
          await page.close();
        }
        
        // Small delay between brokers to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`Completed scan ${job.scan_id}: ${foundCount} found, ${cleanCount} clean, ${errorCount} errors`);
    }
    
  } catch (error) {
    console.error('Scanner error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\nBroker scanner completed');
}

main().catch(console.error);
