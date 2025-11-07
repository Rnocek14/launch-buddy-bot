import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin role
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, jobId, batchSize = 5 } = await req.json();

    switch (action) {
      case 'estimate':
        return await handleEstimate(supabaseClient);
      
      case 'start':
        return await handleStart(supabaseClient, user.id, batchSize);
      
      case 'process':
        return await handleProcess(supabaseClient, jobId, batchSize);
      
      case 'pause':
        return await handlePause(supabaseClient, jobId);
      
      case 'resume':
        return await handleResume(supabaseClient, jobId);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('Error in bulk-discover-contacts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleEstimate(supabaseClient: any) {
  // Count services without verified contacts
  const { data: services, error } = await supabaseClient
    .from('service_catalog')
    .select('id, domain, name')
    .or('contact_verified.is.null,contact_verified.eq.false');

  if (error) throw error;

  const totalServices = services?.length || 0;
  
  // Cost estimation:
  // - Discovery call: ~$0.01 per service (OpenAI API call)
  // - Validation call: ~$0.001 per service (DNS lookup is free, but API overhead)
  const estimatedCost = totalServices * 0.011;

  return new Response(JSON.stringify({ 
    totalServices,
    estimatedCost: estimatedCost.toFixed(2),
    estimatedTimeMinutes: Math.ceil(totalServices / 10) // ~10 services per minute
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleStart(supabaseClient: any, userId: string, batchSize: number) {
  // Get services without verified contacts
  const { data: services, error: servicesError } = await supabaseClient
    .from('service_catalog')
    .select('id, domain, name')
    .or('contact_verified.is.null,contact_verified.eq.false');

  if (servicesError) throw servicesError;

  const totalServices = services?.length || 0;
  const estimatedCost = totalServices * 0.011;

  // Create job
  const { data: job, error: jobError } = await supabaseClient
    .from('bulk_discovery_jobs')
    .insert({
      created_by: userId,
      status: 'running',
      total_services: totalServices,
      estimated_cost: estimatedCost,
      started_at: new Date().toISOString(),
      progress_data: { serviceIds: services.map((s: any) => s.id) }
    })
    .select()
    .single();

  if (jobError) throw jobError;

      // Start processing in background
      processJobInBackground(supabaseClient, job.id, batchSize).catch(console.error);

      return new Response(JSON.stringify({ job }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleProcess(supabaseClient: any, jobId: string, batchSize: number) {
  processJobInBackground(supabaseClient, jobId, batchSize).catch(console.error);
  
  return new Response(JSON.stringify({ message: 'Processing resumed' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handlePause(supabaseClient: any, jobId: string) {
  const { error } = await supabaseClient
    .from('bulk_discovery_jobs')
    .update({ status: 'paused' })
    .eq('id', jobId);

  if (error) throw error;

  return new Response(JSON.stringify({ message: 'Job paused' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleResume(supabaseClient: any, jobId: string) {
  const { error } = await supabaseClient
    .from('bulk_discovery_jobs')
    .update({ status: 'running' })
    .eq('id', jobId);

  if (error) throw error;

  return new Response(JSON.stringify({ message: 'Job resumed' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function processJobInBackground(supabaseClient: any, jobId: string, batchSize: number) {
  try {
    console.log(`Starting background processing for job ${jobId}`);
    
    let { data: job, error: fetchError } = await supabaseClient
      .from('bulk_discovery_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.error('Failed to fetch job:', fetchError);
      return;
    }

    const serviceIds = job.progress_data.serviceIds || [];
    const processedIds = job.progress_data.processedIds || [];
    const remainingIds = serviceIds.filter((id: string) => !processedIds.includes(id));

    let totalCost = job.actual_cost || 0;
    let successCount = job.successful_discoveries;
    let failCount = job.failed_discoveries;

    // Process in batches
    for (let i = 0; i < remainingIds.length; i += batchSize) {
      // Check if job is paused
      const { data: currentJob } = await supabaseClient
        .from('bulk_discovery_jobs')
        .select('status')
        .eq('id', jobId)
        .single();

      if (currentJob?.status === 'paused') {
        console.log('Job paused, stopping processing');
        break;
      }

      const batch = remainingIds.slice(i, i + batchSize);
      
      // Process each service in the batch
      for (const serviceId of batch) {
        try {
          // Fetch service details
          const { data: service } = await supabaseClient
            .from('service_catalog')
            .select('domain, name')
            .eq('id', serviceId)
            .single();

          if (!service?.domain) {
            processedIds.push(serviceId);
            failCount++;
            continue;
          }

          // Discover contacts
          const { data: discoveryData, error: discoveryError } = await supabaseClient.functions.invoke(
            'discover-privacy-contacts',
            { body: { service_id: serviceId } }
          );

          if (discoveryError) {
            console.error(`Discovery failed for ${service.name}:`, discoveryError.message || discoveryError);
            
            // Track errors with details
            const errorDetails = {
              serviceId,
              serviceName: service.name,
              error: discoveryError.message || 'Unknown error',
              timestamp: new Date().toISOString()
            };
            
            console.log('Error details:', JSON.stringify(errorDetails));
            
            processedIds.push(serviceId);
            failCount++;
            totalCost += 0.011; // Add cost even on failure
            continue;
          }

          // Check if discovery was successful
          if (!discoveryData?.success) {
            console.warn(`No contacts found for ${service.name}`);
            processedIds.push(serviceId);
            failCount++;
            totalCost += 0.011;
            continue;
          }

          totalCost += 0.011; // Discovery cost

          // If email contact found, validate it
          const emailContact = discoveryData.contacts?.find((c: any) => c.contact_type === 'email');
          if (emailContact) {
            try {
              const { data: validationData, error: validationError } = await supabaseClient.functions.invoke(
                'validate-email-contact',
                { 
                  body: { 
                    email: emailContact.value,
                    serviceId,
                    contactId: emailContact.id,
                    updateDatabase: true
                  } 
                }
              );

              totalCost += 0.001; // Validation cost
              
              if (validationError) {
                console.error(`Validation failed for ${service.name}:`, validationError);
                failCount++;
              } else if (validationData?.validation?.isValid) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (validationErr) {
              console.error(`Validation error for ${service.name}:`, validationErr);
              failCount++;
              totalCost += 0.001;
            }
          } else {
            // No email contact found
            console.log(`No email contact found for ${service.name}`);
            failCount++;
          }

          processedIds.push(serviceId);

          // Update progress every service
          await supabaseClient
            .from('bulk_discovery_jobs')
            .update({
              processed_services: processedIds.length,
              successful_discoveries: successCount,
              failed_discoveries: failCount,
              actual_cost: totalCost,
              progress_data: { serviceIds, processedIds }
            })
            .eq('id', jobId);

        } catch (error) {
          console.error('Error processing service:', error);
          processedIds.push(serviceId);
          failCount++;
        }
      }

      // Small delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Mark as completed if all processed
    if (processedIds.length === serviceIds.length) {
      await supabaseClient
        .from('bulk_discovery_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_services: processedIds.length,
          successful_discoveries: successCount,
          failed_discoveries: failCount,
          actual_cost: totalCost
        })
        .eq('id', jobId);

      console.log(`Job ${jobId} completed successfully`);
    }
  } catch (error) {
    console.error('Background processing error:', error);
    await supabaseClient
      .from('bulk_discovery_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}