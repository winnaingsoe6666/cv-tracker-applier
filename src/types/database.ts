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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      Account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Application: {
        Row: {
          appliedAt: string | null
          atsScoreSnapshot: number | null
          checklistJson: string | null
          createdAt: string | null
          id: string
          jobId: string
          matchScoreSnapshot: number | null
          mode: string | null
          notes: string | null
          resumeId: string | null
          resumeVariantTag: string | null
          status: string | null
          updatedAt: string | null
          userId: string
        }
        Insert: {
          appliedAt?: string | null
          atsScoreSnapshot?: number | null
          checklistJson?: string | null
          createdAt?: string | null
          id?: string
          jobId: string
          matchScoreSnapshot?: number | null
          mode?: string | null
          notes?: string | null
          resumeId?: string | null
          resumeVariantTag?: string | null
          status?: string | null
          updatedAt?: string | null
          userId: string
        }
        Update: {
          appliedAt?: string | null
          atsScoreSnapshot?: number | null
          checklistJson?: string | null
          createdAt?: string | null
          id?: string
          jobId?: string
          matchScoreSnapshot?: number | null
          mode?: string | null
          notes?: string | null
          resumeId?: string | null
          resumeVariantTag?: string | null
          status?: string | null
          updatedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Application_jobId_fkey"
            columns: ["jobId"]
            isOneToOne: true
            referencedRelation: "Job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Application_resumeId_fkey"
            columns: ["resumeId"]
            isOneToOne: false
            referencedRelation: "Resume"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Application_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AtsReport: {
        Row: {
          breakdownJson: string
          createdAt: string | null
          id: string
          jobId: string | null
          resumeId: string
          score: number
        }
        Insert: {
          breakdownJson: string
          createdAt?: string | null
          id?: string
          jobId?: string | null
          resumeId: string
          score: number
        }
        Update: {
          breakdownJson?: string
          createdAt?: string | null
          id?: string
          jobId?: string | null
          resumeId?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "AtsReport_jobId_fkey"
            columns: ["jobId"]
            isOneToOne: false
            referencedRelation: "Job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AtsReport_resumeId_fkey"
            columns: ["resumeId"]
            isOneToOne: false
            referencedRelation: "Resume"
            referencedColumns: ["id"]
          },
        ]
      }
      CollabNote: {
        Row: {
          applicationId: string
          authorId: string
          content: string
          createdAt: string | null
          id: string
        }
        Insert: {
          applicationId: string
          authorId: string
          content: string
          createdAt?: string | null
          id?: string
        }
        Update: {
          applicationId?: string
          authorId?: string
          content?: string
          createdAt?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "CollabNote_applicationId_fkey"
            columns: ["applicationId"]
            isOneToOne: false
            referencedRelation: "Application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CollabNote_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Collaboration: {
        Row: {
          collaboratorEmail: string
          createdAt: string | null
          id: string
          ownerId: string
          role: string | null
        }
        Insert: {
          collaboratorEmail: string
          createdAt?: string | null
          id?: string
          ownerId: string
          role?: string | null
        }
        Update: {
          collaboratorEmail?: string
          createdAt?: string | null
          id?: string
          ownerId?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Collaboration_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      CoverLetter: {
        Row: {
          content: string
          createdAt: string | null
          id: string
          jobId: string
          resumeId: string | null
          template: string
          updatedAt: string | null
          userId: string
        }
        Insert: {
          content: string
          createdAt?: string | null
          id?: string
          jobId: string
          resumeId?: string | null
          template: string
          updatedAt?: string | null
          userId: string
        }
        Update: {
          content?: string
          createdAt?: string | null
          id?: string
          jobId?: string
          resumeId?: string | null
          template?: string
          updatedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "CoverLetter_jobId_fkey"
            columns: ["jobId"]
            isOneToOne: false
            referencedRelation: "Job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CoverLetter_resumeId_fkey"
            columns: ["resumeId"]
            isOneToOne: false
            referencedRelation: "Resume"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CoverLetter_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Job: {
        Row: {
          company: string
          createdAt: string | null
          currency: string | null
          description: string
          id: string
          location: string | null
          market: string | null
          salaryMax: number | null
          salaryMin: number | null
          seniority: string | null
          source: string | null
          title: string
          url: string | null
          userId: string
          worthinessJson: string | null
        }
        Insert: {
          company: string
          createdAt?: string | null
          currency?: string | null
          description: string
          id?: string
          location?: string | null
          market?: string | null
          salaryMax?: number | null
          salaryMin?: number | null
          seniority?: string | null
          source?: string | null
          title: string
          url?: string | null
          userId: string
          worthinessJson?: string | null
        }
        Update: {
          company?: string
          createdAt?: string | null
          currency?: string | null
          description?: string
          id?: string
          location?: string | null
          market?: string | null
          salaryMax?: number | null
          salaryMin?: number | null
          seniority?: string | null
          source?: string | null
          title?: string
          url?: string | null
          userId?: string
          worthinessJson?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Job_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      MatchReport: {
        Row: {
          breakdownJson: string
          createdAt: string | null
          id: string
          jobId: string
          resumeId: string
          score: number
        }
        Insert: {
          breakdownJson: string
          createdAt?: string | null
          id?: string
          jobId: string
          resumeId: string
          score: number
        }
        Update: {
          breakdownJson?: string
          createdAt?: string | null
          id?: string
          jobId?: string
          resumeId?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "MatchReport_jobId_fkey"
            columns: ["jobId"]
            isOneToOne: false
            referencedRelation: "Job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "MatchReport_resumeId_fkey"
            columns: ["resumeId"]
            isOneToOne: false
            referencedRelation: "Resume"
            referencedColumns: ["id"]
          },
        ]
      }
      OutcomeEvent: {
        Row: {
          applicationId: string
          createdAt: string | null
          fromStatus: string
          id: string
          toStatus: string
          type: string | null
        }
        Insert: {
          applicationId: string
          createdAt?: string | null
          fromStatus: string
          id?: string
          toStatus: string
          type?: string | null
        }
        Update: {
          applicationId?: string
          createdAt?: string | null
          fromStatus?: string
          id?: string
          toStatus?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "OutcomeEvent_applicationId_fkey"
            columns: ["applicationId"]
            isOneToOne: false
            referencedRelation: "Application"
            referencedColumns: ["id"]
          },
        ]
      }
      Resume: {
        Row: {
          createdAt: string | null
          id: string
          isBase: boolean | null
          parentId: string | null
          parsedJson: string
          rawText: string
          roleFamily: string | null
          sourceFileName: string | null
          title: string
          updatedAt: string | null
          userId: string
        }
        Insert: {
          createdAt?: string | null
          id?: string
          isBase?: boolean | null
          parentId?: string | null
          parsedJson: string
          rawText: string
          roleFamily?: string | null
          sourceFileName?: string | null
          title: string
          updatedAt?: string | null
          userId: string
        }
        Update: {
          createdAt?: string | null
          id?: string
          isBase?: boolean | null
          parentId?: string | null
          parsedJson?: string
          rawText?: string
          roleFamily?: string | null
          sourceFileName?: string | null
          title?: string
          updatedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Resume_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SavedSearch: {
        Row: {
          active: boolean | null
          createdAt: string | null
          id: string
          label: string
          lastNotifiedAt: string | null
          market: string | null
          minSalary: number | null
          query: string
          seniority: string | null
          userId: string
        }
        Insert: {
          active?: boolean | null
          createdAt?: string | null
          id?: string
          label: string
          lastNotifiedAt?: string | null
          market?: string | null
          minSalary?: number | null
          query: string
          seniority?: string | null
          userId: string
        }
        Update: {
          active?: boolean | null
          createdAt?: string | null
          id?: string
          label?: string
          lastNotifiedAt?: string | null
          market?: string | null
          minSalary?: number | null
          query?: string
          seniority?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "SavedSearch_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ShareToken: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          refId: string
          token: string | null
          type: string | null
          userId: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id?: string
          refId: string
          token?: string | null
          type?: string | null
          userId: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          refId?: string
          token?: string | null
          type?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ShareToken_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          apiToken: string | null
          createdAt: string | null
          email: string
          gateAtsThreshold: number | null
          gateMatchThreshold: number | null
          headline: string | null
          id: string
          image: string | null
          isAdmin: boolean | null
          linkedin: string | null
          location: string | null
          name: string
          passwordHash: string | null
          phone: string | null
          plan: string | null
          profilePublic: boolean | null
          reminderDays: number | null
          stripeCustomerId: string | null
          stripeSubscriptionId: string | null
          username: string | null
        }
        Insert: {
          apiToken?: string | null
          createdAt?: string | null
          email: string
          gateAtsThreshold?: number | null
          gateMatchThreshold?: number | null
          headline?: string | null
          id?: string
          image?: string | null
          isAdmin?: boolean | null
          linkedin?: string | null
          location?: string | null
          name: string
          passwordHash?: string | null
          phone?: string | null
          plan?: string | null
          profilePublic?: boolean | null
          reminderDays?: number | null
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
          username?: string | null
        }
        Update: {
          apiToken?: string | null
          createdAt?: string | null
          email?: string
          gateAtsThreshold?: number | null
          gateMatchThreshold?: number | null
          headline?: string | null
          id?: string
          image?: string | null
          isAdmin?: boolean | null
          linkedin?: string | null
          location?: string | null
          name?: string
          passwordHash?: string | null
          phone?: string | null
          plan?: string | null
          profilePublic?: boolean | null
          reminderDays?: number | null
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
