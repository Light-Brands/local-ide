/**
 * Supabase Database Types
 *
 * This file should be generated from your Supabase schema using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 *
 * Below is a starter schema with common tables. Replace with generated types
 * once your database is set up.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Users profile table (extends Supabase auth.users)
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin' | 'editor';
          metadata: Json | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'editor';
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'editor';
          metadata?: Json | null;
        };
        Relationships: [];
      };

      // Content/CMS table
      content: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          slug: string;
          title: string;
          description: string | null;
          body: string | null;
          featured_image: string | null;
          status: 'draft' | 'published' | 'archived';
          author_id: string;
          metadata: Json | null;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug: string;
          title: string;
          description?: string | null;
          body?: string | null;
          featured_image?: string | null;
          status?: 'draft' | 'published' | 'archived';
          author_id: string;
          metadata?: Json | null;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          body?: string | null;
          featured_image?: string | null;
          status?: 'draft' | 'published' | 'archived';
          author_id?: string;
          metadata?: Json | null;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'content_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      // Media/Assets table
      media: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          uploaded_by: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          uploaded_by: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'media_uploaded_by_fkey';
            columns: ['uploaded_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      // Settings/Configuration table
      settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };

      // Analytics/Events table
      analytics_events: {
        Row: {
          id: string;
          created_at: string;
          event_type: string;
          event_data: Json | null;
          user_id: string | null;
          session_id: string | null;
          page_url: string | null;
          referrer: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_type: string;
          event_data?: Json | null;
          user_id?: string | null;
          session_id?: string | null;
          page_url?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_type?: string;
          event_data?: Json | null;
          user_id?: string | null;
          session_id?: string | null;
          page_url?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };

      // Feedback table for element capture feedback system
      feedback: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          page_id: string;
          page_url: string;
          section_path: string | null;
          component_name: string | null;
          category: 'bug' | 'enhancement' | 'question' | 'content';
          priority: 'low' | 'medium' | 'high' | 'critical';
          status: 'new' | 'in-progress' | 'resolved' | 'blocked';
          title: string | null;
          notes: string | null;
          position: Json | null;
          text_context: Json | null;
          screenshot_url: string | null;
          user_id: string | null;
          resolved_at: string | null;
          resolution: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          page_id: string;
          page_url: string;
          section_path?: string | null;
          component_name?: string | null;
          category: 'bug' | 'enhancement' | 'question' | 'content';
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'new' | 'in-progress' | 'resolved' | 'blocked';
          title?: string | null;
          notes?: string | null;
          position?: Json | null;
          text_context?: Json | null;
          screenshot_url?: string | null;
          user_id?: string | null;
          resolved_at?: string | null;
          resolution?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          page_id?: string;
          page_url?: string;
          section_path?: string | null;
          component_name?: string | null;
          category?: 'bug' | 'enhancement' | 'question' | 'content';
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'new' | 'in-progress' | 'resolved' | 'blocked';
          title?: string | null;
          notes?: string | null;
          position?: Json | null;
          text_context?: Json | null;
          screenshot_url?: string | null;
          user_id?: string | null;
          resolved_at?: string | null;
          resolution?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'user' | 'admin' | 'editor';
      content_status: 'draft' | 'published' | 'archived';
      feedback_category: 'bug' | 'enhancement' | 'question' | 'content';
      feedback_priority: 'low' | 'medium' | 'high' | 'critical';
      feedback_status: 'new' | 'in-progress' | 'resolved' | 'blocked';
    };
  };
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type Profile = Tables<'profiles'>;
export type Content = Tables<'content'>;
export type Media = Tables<'media'>;
export type Setting = Tables<'settings'>;
export type AnalyticsEvent = Tables<'analytics_events'>;
export type Feedback = Tables<'feedback'>;
