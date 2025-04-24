import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define a type for PostgreSQL errors
interface PostgrestError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Define the status interface
interface SchemaFixStatus {
  columnsChecked: string[];
  hasUserId: boolean;
  hasCreatorId: boolean;
  actions: string[];
  error?: string;
  columnsAfterFix?: string[];
  hasUserIdAfterFix?: boolean;
  hasCreatorIdAfterFix?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Check the memes table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'memes');
      
    if (columnsError) {
      console.error('Error checking columns:', columnsError);
      return NextResponse.json({ 
        error: (columnsError as PostgrestError).message || 'Unknown error',
        step: 'checking_columns'
      }, { status: 500 });
    }

    // Extract column names
    const columnNames = columns ? columns.map(col => col.column_name) : [];
    const hasUserId = columnNames.includes('user_id');
    const hasCreatorId = columnNames.includes('creator_id');

    // Start with a status object
    const status: SchemaFixStatus = {
      columnsChecked: columnNames,
      hasUserId,
      hasCreatorId,
      actions: []
    };

    // Fix the column mismatch based on what exists
    if (!hasUserId && hasCreatorId) {
      // Add user_id column and set it to creator_id values
      const sql = `
        ALTER TABLE public.memes ADD COLUMN user_id UUID;
        UPDATE public.memes SET user_id = creator_id;
      `;
      
      const { error: addError } = await supabase.rpc('exec_sql', { sql });
      
      if (addError) {
        status.actions.push('Failed to add user_id column');
        status.error = (addError as PostgrestError).message;
      } else {
        status.actions.push('Added user_id column and copied values from creator_id');
      }
    } else if (hasUserId && !hasCreatorId) {
      // Add creator_id column and set it to user_id values
      const sql = `
        ALTER TABLE public.memes ADD COLUMN creator_id UUID;
        UPDATE public.memes SET creator_id = user_id;
      `;
      
      const { error: addError } = await supabase.rpc('exec_sql', { sql });
      
      if (addError) {
        status.actions.push('Failed to add creator_id column');
        status.error = (addError as PostgrestError).message;
      } else {
        status.actions.push('Added creator_id column and copied values from user_id');
      }
    } else if (!hasUserId && !hasCreatorId) {
      // Both columns are missing - create both
      const sql = `
        ALTER TABLE public.memes ADD COLUMN user_id UUID;
        ALTER TABLE public.memes ADD COLUMN creator_id UUID;
      `;
      
      const { error: addError } = await supabase.rpc('exec_sql', { sql });
      
      if (addError) {
        status.actions.push('Failed to add user_id and creator_id columns');
        status.error = (addError as PostgrestError).message;
      } else {
        status.actions.push('Added both user_id and creator_id columns');
      }
    } else {
      // Both columns exist - no action needed
      status.actions.push('Both columns already exist - no changes needed');
    }
    
    // Check if the fixed columns exist now
    const { data: updatedColumns, error: updatedColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'memes');

    if (!updatedColumnsError) {
      const updatedColumnNames = updatedColumns ? updatedColumns.map(col => col.column_name) : [];
      status.columnsAfterFix = updatedColumnNames;
      status.hasUserIdAfterFix = updatedColumnNames.includes('user_id');
      status.hasCreatorIdAfterFix = updatedColumnNames.includes('creator_id');
    }

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      step: 'unexpected_error'
    }, { status: 500 });
  }
} 