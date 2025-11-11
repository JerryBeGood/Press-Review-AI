/**
 * Database types for Supabase Edge Functions
 * This is a copy of the database types from src/db/database.types.ts
 * Edge Functions need their own copy since they run in Deno environment
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      generated_press_reviews: {
        Row: {
          analysis: Json | null;
          content: Json | null;
          error: string | null;
          generated_at: string | null;
          generated_queries: Json | null;
          id: string;
          press_review_id: string;
          research_results: Json | null;
          status: Database["public"]["Enums"]["generation_status"];
          user_id: string;
        };
        Insert: {
          analysis?: Json | null;
          content?: Json | null;
          error?: string | null;
          generated_at?: string | null;
          generated_queries?: Json | null;
          id?: string;
          press_review_id: string;
          research_results?: Json | null;
          status?: Database["public"]["Enums"]["generation_status"];
          user_id: string;
        };
        Update: {
          analysis?: Json | null;
          content?: Json | null;
          error?: string | null;
          generated_at?: string | null;
          generated_queries?: Json | null;
          id?: string;
          press_review_id?: string;
          research_results?: Json | null;
          status?: Database["public"]["Enums"]["generation_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_press_reviews_press_review_id_fkey";
            columns: ["press_review_id"];
            isOneToOne: false;
            referencedRelation: "press_reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      press_reviews: {
        Row: {
          created_at: string;
          id: string;
          schedule: string;
          topic: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          schedule: string;
          topic: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          schedule?: string;
          topic?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      generation_status:
        | "pending"
        | "generating_queries"
        | "researching_sources"
        | "synthesizing_content"
        | "success"
        | "failed";
    };
    CompositeTypes: Record<never, never>;
  };
}
