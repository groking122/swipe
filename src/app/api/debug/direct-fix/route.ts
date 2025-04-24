import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const result: any = {
      status: "started",
      steps: []
    };

    // Step 1: First check if the memes table exists
    let { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) {
      result.steps.push({
        step: "check_tables_exist",
        status: "error",
        error: tablesError.message
      });
      return NextResponse.json(result);
    }

    const memesTableExists = tables?.some(t => t.tablename === 'memes');
    result.steps.push({
      step: "check_tables_exist",
      status: "success",
      memesTableExists
    });

    if (!memesTableExists) {
      // Create the memes table if it doesn't exist
      const createMemesSql = `
        CREATE TABLE IF NOT EXISTS public.memes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          image_path TEXT,
          user_id UUID,
          creator_id UUID,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createMemesSql 
      });
      
      if (createError) {
        result.steps.push({
          step: "create_memes_table",
          status: "error",
          error: createError.message
        });
      } else {
        result.steps.push({
          step: "create_memes_table",
          status: "success"
        });
      }
    }
    
    // Step 2: Now check the columns in the memes table
    let { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'memes');
      
    if (columnsError) {
      // Different approach to get columns
      const { data: colsData, error: colsError } = await supabase
        .from('memes')
        .select('*')
        .limit(1);
        
      if (colsError) {
        result.steps.push({
          step: "check_columns",
          status: "error",
          error: colsError.message
        });
      } else {
        columns = colsData && colsData[0] ? 
          Object.keys(colsData[0]).map(col => ({ column_name: col })) : 
          [];
          
        result.steps.push({
          step: "check_columns",
          status: "success",
          method: "sample_record",
          columns: columns.map(c => c.column_name)
        });
      }
    } else {
      result.steps.push({
        step: "check_columns",
        status: "success",
        method: "schema_query",
        columns: columns?.map(c => c.column_name) || []
      });
    }
    
    // Check for user_id and creator_id columns
    const columnNames = columns?.map(c => c.column_name) || [];
    const hasUserId = columnNames.includes('user_id');
    const hasCreatorId = columnNames.includes('creator_id');
    
    result.columnStatus = {
      hasUserId,
      hasCreatorId
    };
    
    // Step 3: Fix columns based on what's missing
    if (!hasUserId) {
      // Add user_id column
      const { error: addUserIdError } = await supabase
        .from('memes')
        .update({ user_id: null })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // This won't update anything but will ensure column exists
      
      if (addUserIdError && !addUserIdError.message.includes('does not exist')) {
        result.steps.push({
          step: "add_user_id",
          status: "error",
          error: addUserIdError.message
        });
      } else {
        result.steps.push({
          step: "add_user_id",
          status: "success"
        });
      }
    }
    
    if (!hasCreatorId) {
      // Add creator_id column
      const { error: addCreatorIdError } = await supabase
        .from('memes')
        .update({ creator_id: null })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // This won't update anything but will ensure column exists
      
      if (addCreatorIdError && !addCreatorIdError.message.includes('does not exist')) {
        result.steps.push({
          step: "add_creator_id",
          status: "error",
          error: addCreatorIdError.message
        });
      } else {
        result.steps.push({
          step: "add_creator_id",
          status: "success"
        });
      }
    }
    
    // Step 4: Check if we need to copy data between columns
    if (hasUserId && hasCreatorId) {
      // Use SQL to handle the update
      const { error: syncError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE public.memes 
          SET user_id = creator_id 
          WHERE user_id IS NULL AND creator_id IS NOT NULL;
          
          UPDATE public.memes 
          SET creator_id = user_id 
          WHERE creator_id IS NULL AND user_id IS NOT NULL;
        `
      });
      
      if (syncError) {
        result.steps.push({
          step: "sync_columns",
          status: "error",
          error: syncError.message
        });
      } else {
        result.steps.push({
          step: "sync_columns",
          status: "success"
        });
      }
    }
    
    // Step 5: Check the fix worked by getting a sample record
    const { data: sampleData, error: sampleError } = await supabase
      .from('memes')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      result.steps.push({
        step: "verify_fix",
        status: "error",
        error: sampleError.message
      });
    } else {
      const updatedColumns = sampleData && sampleData[0] ? 
        Object.keys(sampleData[0]) : [];
        
      result.steps.push({
        step: "verify_fix",
        status: "success",
        updatedColumns,
        hasUserIdNow: updatedColumns.includes('user_id'),
        hasCreatorIdNow: updatedColumns.includes('creator_id')
      });
    }
    
    result.status = "complete";
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      status: "failed"
    }, { status: 500 });
  }
} 