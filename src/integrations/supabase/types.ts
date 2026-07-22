export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      account_homologations: {
        Row: {
          ambiguity_flag: boolean | null
          analysis_id: string
          canonical_account: string
          category: string
          confidence_score: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          document_id: string | null
          id: string
          mapping_notes: string | null
          original_label: string
          period: string | null
          value: number | null
        }
        Insert: {
          ambiguity_flag?: boolean | null
          analysis_id: string
          canonical_account: string
          category: string
          confidence_score?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          document_id?: string | null
          id?: string
          mapping_notes?: string | null
          original_label: string
          period?: string | null
          value?: number | null
        }
        Update: {
          ambiguity_flag?: boolean | null
          analysis_id?: string
          canonical_account?: string
          category?: string
          confidence_score?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          document_id?: string | null
          id?: string
          mapping_notes?: string | null
          original_label?: string
          period?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "account_homologations_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_homologations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          calculation_result: Json | null
          company_name: string
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          expected_growth: number | null
          id: string
          input_payload: Json | null
          moneda_analisis: string | null
          sector: string
          snapshot_id: string | null
          status: Database["public"]["Enums"]["analysis_status"]
          updated_at: string
          user_id: string
          validation_status: string | null
        }
        Insert: {
          calculation_result?: Json | null
          company_name?: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          expected_growth?: number | null
          id?: string
          input_payload?: Json | null
          moneda_analisis?: string | null
          sector: string
          snapshot_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string
          user_id: string
          validation_status?: string | null
        }
        Update: {
          calculation_result?: Json | null
          company_name?: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          expected_growth?: number | null
          id?: string
          input_payload?: Json | null
          moneda_analisis?: string | null
          sector?: string
          snapshot_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string
          user_id?: string
          validation_status?: string | null
        }
        Relationships: []
      }
      analysis_jobs: {
        Row: {
          analysis_id: string
          completed_at: string | null
          created_at: string | null
          error_mensaje: string | null
          id: string
          input_payload: Json | null
          job_type: string
          output_payload: Json | null
          progreso_mensaje: string | null
          progreso_pct: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          analysis_id: string
          completed_at?: string | null
          created_at?: string | null
          error_mensaje?: string | null
          id?: string
          input_payload?: Json | null
          job_type: string
          output_payload?: Json | null
          progreso_mensaje?: string | null
          progreso_pct?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          analysis_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_mensaje?: string | null
          id?: string
          input_payload?: Json | null
          job_type?: string
          output_payload?: Json | null
          progreso_mensaje?: string | null
          progreso_pct?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          analysis_id: string | null
          component: string | null
          created_at: string
          event_detail: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          analysis_id?: string | null
          component?: string | null
          created_at?: string
          event_detail?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          analysis_id?: string | null
          component?: string | null
          created_at?: string
          event_detail?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      calculation_results: {
        Row: {
          analysis_id: string
          created_at: string
          engine_version: string | null
          id: string
          input_payload: Json
          output_payload: Json
        }
        Insert: {
          analysis_id: string
          created_at?: string
          engine_version?: string | null
          id?: string
          input_payload: Json
          output_payload: Json
        }
        Update: {
          analysis_id?: string
          created_at?: string
          engine_version?: string | null
          id?: string
          input_payload?: Json
          output_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "calculation_results_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          frecuencia: string
          id: string
          nombre: string
          tipo: string
          url_referencia: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          frecuencia: string
          id?: string
          nombre: string
          tipo: string
          url_referencia?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          frecuencia?: string
          id?: string
          nombre?: string
          tipo?: string
          url_referencia?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          analysis_id: string
          checksum: string | null
          doc_type_declared: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          original_filename: string
          processing_status: Database["public"]["Enums"]["doc_processing_status"]
          storage_path: string | null
          uploaded_at: string
        }
        Insert: {
          analysis_id: string
          checksum?: string | null
          doc_type_declared?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          original_filename: string
          processing_status?: Database["public"]["Enums"]["doc_processing_status"]
          storage_path?: string | null
          uploaded_at?: string
        }
        Update: {
          analysis_id?: string
          checksum?: string | null
          doc_type_declared?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string
          processing_status?: Database["public"]["Enums"]["doc_processing_status"]
          storage_path?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_parsed: {
        Row: {
          created_at: string
          document_id: string
          id: string
          parsed_structure: Json
          parsing_metadata: Json | null
          periods_detected: string[] | null
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          parsed_structure?: Json
          parsing_metadata?: Json | null
          periods_detected?: string[] | null
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          parsed_structure?: Json
          parsing_metadata?: Json | null
          periods_detected?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_parsed_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      external_snapshots: {
        Row: {
          created_at: string
          data_payload: Json
          effective_date: string
          id: string
          macro_payload: Json | null
          sector: string | null
          source_version: string | null
        }
        Insert: {
          created_at?: string
          data_payload: Json
          effective_date: string
          id?: string
          macro_payload?: Json | null
          sector?: string | null
          source_version?: string | null
        }
        Update: {
          created_at?: string
          data_payload?: Json
          effective_date?: string
          id?: string
          macro_payload?: Json | null
          sector?: string | null
          source_version?: string | null
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          analysis_id: string
          file_path: string | null
          generated_at: string
          id: string
          report_version: string | null
        }
        Insert: {
          analysis_id: string
          file_path?: string | null
          generated_at?: string
          id?: string
          report_version?: string | null
        }
        Update: {
          analysis_id?: string
          file_path?: string | null
          generated_at?: string
          id?: string
          report_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      job_locks: {
        Row: {
          expires_at: string | null
          id: string
          job_key: string
          locked_at: string | null
          locked_by: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          job_key: string
          locked_at?: string | null
          locked_by?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          job_key?: string
          locked_at?: string | null
          locked_by?: string | null
        }
        Relationships: []
      }
      manual_reviews: {
        Row: {
          analysis_id: string
          correcciones: Json | null
          created_at: string
          cuentas_a_revisar: Json | null
          estado: string
          id: string
          prioridad: string | null
          reason: string
          requested_by: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          reviewed_by: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_id: string
          correcciones?: Json | null
          created_at?: string
          cuentas_a_revisar?: Json | null
          estado?: string
          id?: string
          prioridad?: string | null
          reason: string
          requested_by: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_id?: string
          correcciones?: Json | null
          created_at?: string
          cuentas_a_revisar?: Json | null
          estado?: string
          id?: string
          prioridad?: string | null
          reason?: string
          requested_by?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_reviews_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_narratives: {
        Row: {
          analysis_id: string
          audit_notes: string | null
          audit_passed: boolean | null
          created_at: string
          executive_summary: string | null
          generation_version: string | null
          id: string
          sections_payload: Json | null
        }
        Insert: {
          analysis_id: string
          audit_notes?: string | null
          audit_passed?: boolean | null
          created_at?: string
          executive_summary?: string | null
          generation_version?: string | null
          id?: string
          sections_payload?: Json | null
        }
        Update: {
          analysis_id?: string
          audit_notes?: string | null
          audit_passed?: boolean | null
          created_at?: string
          executive_summary?: string | null
          generation_version?: string | null
          id?: string
          sections_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "report_narratives_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshot_updates: {
        Row: {
          estado: string | null
          fecha_dato: string
          fuente_detalle: string | null
          id: string
          notas_validacion: string | null
          parametro: string
          sector: string | null
          source_id: string | null
          unidad: string | null
          updated_at: string | null
          valor_anterior: number | null
          valor_nuevo: number | null
        }
        Insert: {
          estado?: string | null
          fecha_dato: string
          fuente_detalle?: string | null
          id?: string
          notas_validacion?: string | null
          parametro: string
          sector?: string | null
          source_id?: string | null
          unidad?: string | null
          updated_at?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number | null
        }
        Update: {
          estado?: string | null
          fecha_dato?: string
          fuente_detalle?: string | null
          id?: string
          notas_validacion?: string | null
          parametro?: string
          sector?: string | null
          source_id?: string | null
          unidad?: string | null
          updated_at?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "snapshot_updates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      structured_inputs: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          input_payload: Json
          version_input: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          input_payload: Json
          version_input?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          input_payload?: Json
          version_input?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structured_inputs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      update_jobs_log: {
        Row: {
          completed_at: string | null
          error_detalle: string | null
          estado: string
          id: string
          job_nombre: string
          parametros: Json | null
          resultado: Json | null
          started_at: string | null
        }
        Insert: {
          completed_at?: string | null
          error_detalle?: string | null
          estado: string
          id?: string
          job_nombre: string
          parametros?: Json | null
          resultado?: Json | null
          started_at?: string | null
        }
        Update: {
          completed_at?: string | null
          error_detalle?: string | null
          estado?: string
          id?: string
          job_nombre?: string
          parametros?: Json | null
          resultado?: Json | null
          started_at?: string | null
        }
        Relationships: []
      }
      validation_results: {
        Row: {
          analysis_id: string
          blocking_flag: boolean | null
          created_at: string
          detail: string | null
          id: string
          rule_code: string
          severity: Database["public"]["Enums"]["validation_severity"]
          status: string
        }
        Insert: {
          analysis_id: string
          blocking_flag?: boolean | null
          created_at?: string
          detail?: string | null
          id?: string
          rule_code: string
          severity: Database["public"]["Enums"]["validation_severity"]
          status: string
        }
        Update: {
          analysis_id?: string
          blocking_flag?: boolean | null
          created_at?: string
          detail?: string | null
          id?: string
          rule_code?: string
          severity?: Database["public"]["Enums"]["validation_severity"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_results_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      analysis_status:
        | "creado"
        | "documentos_cargados"
        | "parsing_en_curso"
        | "parsing_completado"
        | "homologacion_en_curso"
        | "validacion_aprobada"
        | "validacion_con_advertencias"
        | "validacion_bloqueada"
        | "calculo_en_curso"
        | "calculo_completo"
        | "interpretacion_en_curso"
        | "informe_generado"
        | "error_tecnico"
        | "revision_manual_requerida"
      confidence_level: "alta" | "media" | "baja"
      doc_processing_status:
        | "pendiente"
        | "procesando"
        | "completado"
        | "fallido"
      validation_severity: "critica" | "media" | "informativa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_status: [
        "creado",
        "documentos_cargados",
        "parsing_en_curso",
        "parsing_completado",
        "homologacion_en_curso",
        "validacion_aprobada",
        "validacion_con_advertencias",
        "validacion_bloqueada",
        "calculo_en_curso",
        "calculo_completo",
        "interpretacion_en_curso",
        "informe_generado",
        "error_tecnico",
        "revision_manual_requerida",
      ],
      confidence_level: ["alta", "media", "baja"],
      doc_processing_status: [
        "pendiente",
        "procesando",
        "completado",
        "fallido",
      ],
      validation_severity: ["critica", "media", "informativa"],
    },
  },
} as const
