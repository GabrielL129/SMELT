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
      profiles: {
        Row: {
          id: string;
          wallet_address: string;
          display_name: string | null;
          avatar_url: string | null;
          role: "operator" | "observer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      foundries: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          status: "active" | "idle" | "overheated" | "offline" | "maintenance";
          heat: number;
          fuel: number;
          scrap_stockpile: number;
          slag_accumulation: number;
          refined_output: number;
          purity_score: number;
          uptime_seconds: number;
          furnace_mode: "standard" | "aggressive" | "conservation" | "purge";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["foundries"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["foundries"]["Insert"]>;
      };
      agents: {
        Row: {
          id: string;
          foundry_id: string;
          name: string;
          designation: string;
          state: "idle" | "scanning" | "hauling" | "smelting" | "purging" | "repairing" | "overheated" | "alert";
          mode: "manual" | "autonomous";
          energy_level: number;
          integrity: number;
          last_action: string | null;
          last_action_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agents"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };
      furnaces: {
        Row: {
          id: string;
          foundry_id: string;
          designation: string;
          status: "cold" | "warming" | "active" | "critical" | "purging" | "offline";
          temperature: number;
          max_temperature: number;
          efficiency: number;
          total_cycles: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["furnaces"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["furnaces"]["Insert"]>;
      };
      scrap_batches: {
        Row: {
          id: string;
          foundry_id: string;
          batch_code: string;
          scrap_weight: number;
          impurity_level: number;
          thermal_difficulty: number;
          origin: string | null;
          status: "queued" | "processing" | "completed" | "rejected" | "purged";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["scrap_batches"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["scrap_batches"]["Insert"]>;
      };
      batch_jobs: {
        Row: {
          id: string;
          batch_id: string;
          foundry_id: string;
          furnace_id: string | null;
          agent_id: string | null;
          started_at: string | null;
          estimated_completion: string | null;
          completed_at: string | null;
          expected_yield: number;
          actual_yield: number | null;
          status: "pending" | "running" | "completed" | "failed" | "aborted";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["batch_jobs"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["batch_jobs"]["Insert"]>;
      };
      event_logs: {
        Row: {
          id: string;
          foundry_id: string;
          agent_id: string | null;
          event_type: "batch_start" | "batch_complete" | "heat_alert" | "purge" | "repair" | "mode_change" | "warning" | "system" | "epoch";
          severity: "info" | "warning" | "critical";
          message: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["event_logs"]["Row"], "id" | "created_at">;
        Update: never;
      };
      global_events: {
        Row: {
          id: string;
          title: string;
          description: string;
          event_type: "scrap_surge" | "heat_wave" | "slag_crisis" | "refinery_boost" | "system_anomaly";
          active: boolean;
          started_at: string;
          ends_at: string | null;
          effect_data: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["global_events"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["global_events"]["Insert"]>;
      };
      epochs: {
        Row: {
          id: string;
          epoch_number: number;
          label: string;
          total_scrap_processed: number;
          total_refined_output: number;
          top_foundry_id: string | null;
          global_pressure: number;
          started_at: string;
          ended_at: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["epochs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["epochs"]["Insert"]>;
      };
      agent_messages: {
        Row: {
          id: string;
          agent_id: string;
          foundry_id: string;
          message_type: "log" | "alert" | "report" | "commentary";
          content: string;
          is_claude_generated: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agent_messages"]["Row"], "id" | "created_at">;
        Update: never;
      };
      agent_plans: {
        Row: {
          id: string;
          agent_id: string;
          foundry_id: string;
          recommended_actions: Json;
          next_steps: Json;
          risk_level: "low" | "medium" | "high" | "critical";
          risk_summary: string;
          applied: boolean;
          applied_at: string | null;
          is_claude_generated: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agent_plans"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["agent_plans"]["Insert"]>;
      };
    };
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Foundry = Database["public"]["Tables"]["foundries"]["Row"];
export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type Furnace = Database["public"]["Tables"]["furnaces"]["Row"];
export type ScrapBatch = Database["public"]["Tables"]["scrap_batches"]["Row"];
export type BatchJob = Database["public"]["Tables"]["batch_jobs"]["Row"];
export type EventLog = Database["public"]["Tables"]["event_logs"]["Row"];
export type GlobalEvent = Database["public"]["Tables"]["global_events"]["Row"];
export type Epoch = Database["public"]["Tables"]["epochs"]["Row"];
export type AgentMessage = Database["public"]["Tables"]["agent_messages"]["Row"];
export type AgentPlan = Database["public"]["Tables"]["agent_plans"]["Row"];
