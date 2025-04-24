import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to run SQL using a different approach
async function runSQL(sql: string) {
  try {
    // First try using the SQL endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    
    const data = await response.json();
    return { data, error: null };
  } catch (error: any) {
    console.error('SQL error:', error);
    return { data: null, error: error.message || 'Unknown error running SQL' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const result: any = {
      status: "started",
      steps: []
    };

    // Query to get database information
    const { data: queryResult, error: queryError } = await supabase
      .from('memes')
      .select('*')
      .limit(1);
      
    if (queryError) {
      result.steps.push({
        step: "check_table",
        status: "error",
        error: queryError.message
      });
      
      // Table might not exist - try to create it
      const createTableSQL = `
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
      
      const { error: createError } = await runSQL(createTableSQL);
      
      if (createError) {
        result.steps.push({
          step: "create_table",
          status: "error",
          error: createError
        });
        
        // If we can't even create the table, we're stuck
        result.status = "failed";
        return NextResponse.json(result);
      }
      
      result.steps.push({
        step: "create_table",
        status: "success"
      });
    } else {
      // Table exists, check for columns
      const columns = queryResult && queryResult[0] ? Object.keys(queryResult[0]) : [];
      
      result.steps.push({
        step: "check_table", 
        status: "success",
        columns
      });
      
      const hasUserID = columns.includes('user_id');
      const hasCreatorID = columns.includes('creator_id');
      
      result.columnStatus = {
        hasUserID,
        hasCreatorID
      };
      
      // Fix missing columns if needed
      if (!hasUserID) {
        // Add user_id column
        const addUserIDSQL = `
          ALTER TABLE public.memes 
          ADD COLUMN IF NOT EXISTS user_id UUID;
        `;
        
        const { error: addError } = await runSQL(addUserIDSQL);
        
        if (addError) {
          result.steps.push({
            step: "add_user_id",
            status: "error",
            error: addError
          });
        } else {
          result.steps.push({
            step: "add_user_id",
            status: "success"
          });
        }
      }
      
      if (!hasCreatorID) {
        // Add creator_id column
        const addCreatorIDSQL = `
          ALTER TABLE public.memes 
          ADD COLUMN IF NOT EXISTS creator_id UUID;
        `;
        
        const { error: addError } = await runSQL(addCreatorIDSQL);
        
        if (addError) {
          result.steps.push({
            step: "add_creator_id",
            status: "error",
            error: addError
          });
        } else {
          result.steps.push({
            step: "add_creator_id",
            status: "success"
          });
        }
      }
    }
    
    // Sync column values (copy creator_id to user_id where needed)
    const syncSQL = `
      UPDATE public.memes
      SET user_id = creator_id
      WHERE creator_id IS NOT NULL AND user_id IS NULL;
      
      UPDATE public.memes
      SET creator_id = user_id
      WHERE user_id IS NOT NULL AND creator_id IS NULL;
    `;
    
    const { error: syncError } = await runSQL(syncSQL);
    
    if (syncError) {
      result.steps.push({
        step: "sync_columns",
        status: "error",
        error: syncError
      });
    } else {
      result.steps.push({
        step: "sync_columns",
        status: "success"
      });
    }
    
    // Final check - verify columns exist now
    const { data: verifyResult, error: verifyError } = await supabase
      .from('memes')
      .select('*')
      .limit(1);
      
    if (verifyError) {
      result.steps.push({
        step: "verify",
        status: "error",
        error: verifyError.message
      });
    } else {
      const finalColumns = verifyResult && verifyResult[0] ? Object.keys(verifyResult[0]) : [];
      
      result.steps.push({
        step: "verify",
        status: "success",
        finalColumns,
        hasUserID: finalColumns.includes('user_id'),
        hasCreatorID: finalColumns.includes('creator_id')
      });
    }
    
    result.status = "complete";
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error',
      status: "failed"
    }, { status: 500 });
  }
} 