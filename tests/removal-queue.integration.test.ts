import { test, expect } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

async function fixture(customers = 100) {
 const db = new PGlite();
 await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT coalesce(current_setting('test.role',true),'service_role') $$;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT null::uuid $$;
 CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
 CREATE TABLE broker_removal_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,broker_id uuid,scan_result_id uuid,method text,listing_url text,status text,attempts integer DEFAULT 0,sent_at timestamptz,follow_up_at timestamptz,removed_at timestamptz,last_error text,UNIQUE(user_id,broker_id));
 CREATE TABLE broker_scan_results(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,broker_id uuid,status_v2 text,scanned_at timestamptz,evidence_url text,profile_url text);
 CREATE TABLE data_brokers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),privacy_email text,contact_verified_at timestamptz,removal_method text);
 CREATE TABLE subscriptions(user_id uuid,tier text,status text);
 CREATE TABLE user_authorizations(user_id uuid,revoked_at timestamptz);
 `);
 await db.exec(readFileSync('supabase/migrations/20261116072818_eb31af3d-230e-4896-b111-c9d8263bd0a5.sql','utf8'));
 // Use production completion function, excluding network callback functions.
 const migration=readFileSync('supabase/migrations/20261116072934_5770e643-7be9-4c7e-a836-286438f0d408.sql','utf8');
 await db.exec(migration.slice(migration.indexOf('CREATE OR REPLACE FUNCTION public.finish_broker_removal_job')));
 await db.exec(`INSERT INTO data_brokers(privacy_email,contact_verified_at,removal_method) VALUES('privacy@example.invalid',now(),'email');
 INSERT INTO subscriptions SELECT gen_random_uuid(),'complete','active' FROM generate_series(1,${customers});
 INSERT INTO user_authorizations SELECT user_id,null FROM subscriptions;
 INSERT INTO broker_scan_results(user_id,broker_id,status_v2,scanned_at) SELECT s.user_id,b.id,'found',now() FROM subscriptions s CROSS JOIN data_brokers b;`);
 return db;
}

test('bounded preparation and duplicate claim exclusion on production SQL', async () => {
 const db=await fixture();
 await db.query('SELECT prepare_broker_removal_batch(100)');
 await db.query('SELECT prepare_broker_removal_batch(100)');
 expect((await db.query<{count:number}>('SELECT count(*)::int AS count FROM broker_removal_jobs')).rows[0].count).toBe(100);
 const first=await db.query<{id:string}>('SELECT * FROM claim_broker_removal_jobs(gen_random_uuid(),5)');
 const second=await db.query('SELECT * FROM claim_broker_removal_jobs(gen_random_uuid(),5)');
 expect(first.rows.length).toBe(5); expect(second.rows.length).toBe(0);
 await db.close();
});

test('database rejects manual removal without later successful scan', async () => {
 const db=await fixture(1); await db.query('SELECT prepare_broker_removal_batch(100)');
 await expect(db.exec(`UPDATE broker_removal_requests SET status='removed'`)).rejects.toThrow('successful scan');
 await db.exec(`UPDATE broker_removal_requests SET status='request_sent',sent_at=now()-interval '1 hour'; UPDATE broker_scan_results SET status_v2='error';`);
 await db.query('SELECT prepare_broker_removal_batch(100)');
 expect((await db.query<{status:string}>('SELECT status FROM broker_removal_requests')).rows[0].status).toBe('request_sent');
 await db.exec(`UPDATE broker_scan_results SET status_v2='not_found';`); await db.query('SELECT prepare_broker_removal_batch(100)');
 expect((await db.query<{status:string}>('SELECT status FROM broker_removal_requests')).rows[0].status).toBe('removed'); await db.close();
});

test('claim recovery and atomic completion avoid duplicate attempt after acknowledgement', async () => {
 const db=await fixture(1); await db.query('SELECT prepare_broker_removal_batch(100)');
 const token=crypto.randomUUID(); const job=(await db.query<{id:string}>('SELECT * FROM claim_broker_removal_jobs($1,5)',[token])).rows[0];
 expect((await db.query<{done:boolean}>('SELECT finish_broker_removal_job($1,$2,$3) AS done',[job.id,token,'synthetic-provider-id'])).rows[0].done).toBe(true);
 expect((await db.query<{done:boolean}>('SELECT finish_broker_removal_job($1,$2,$3) AS done',[job.id,token,'synthetic-provider-id'])).rows[0].done).toBe(false);
 expect((await db.query<{attempts:number}>('SELECT attempts FROM broker_removal_requests')).rows[0].attempts).toBe(1);
 expect((await db.query<{count:number}>("SELECT count(*)::int AS count FROM broker_removal_jobs WHERE status='pending' AND attempt=2")).rows[0].count).toBe(1);
 await db.close();
});

for(const customers of [100,1000]) test(`isolated ${customers}-customer queue preparation`,async()=>{
 const db=await fixture(customers); const start=performance.now();
 for(let i=0;i<Math.ceil(customers/100);i++) await db.query('SELECT prepare_broker_removal_batch(100)');
 const count=(await db.query<{count:number}>('SELECT count(*)::int AS count FROM broker_removal_jobs')).rows[0].count;
 expect(count).toBe(customers);
 console.log(JSON.stringify({syntheticCustomers:customers,jobs:count,preparationMs:Math.round(performance.now()-start),providerRequests:0,providerCost:0,productionCapacity:'not measured'}));
 await db.close();
},30000);
