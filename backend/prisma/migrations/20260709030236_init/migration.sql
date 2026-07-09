-- CreateEnum
CREATE TYPE "PremiumTier" AS ENUM ('FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'CONFIRMING', 'FINISHED', 'FAILED', 'EXPIRED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "UsageActionType" AS ENUM ('AI_ANALYZE', 'OCR_NAME', 'OCR_HAND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '$2b$10$wzN27C5fWn8.fC/O8v.7.OWY4uNfF/0uO2O8O8O8O8O8O8O8O8O8O',
    "premium_tier" "PremiumTier" NOT NULL DEFAULT 'FREE',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "subscription_expiry" TIMESTAMP(3),
    "max_devices" INTEGER NOT NULL DEFAULT 2,
    "language" TEXT NOT NULL DEFAULT 'en',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token" TEXT,
    "email_verify_expires" TIMESTAMP(3),
    "reset_token" TEXT,
    "reset_token_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAIConfig" (
    "user_id" TEXT NOT NULL,
    "system_prompt" TEXT,
    "exploit_prompt" TEXT,
    "analysis_prompt" TEXT,
    "model_name" TEXT NOT NULL DEFAULT 'gpt-4o',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ai_style" TEXT NOT NULL DEFAULT 'Exploit',
    "aggression_bias" INTEGER NOT NULL DEFAULT 85,
    "insight_depth" TEXT NOT NULL DEFAULT 'Deep',
    "behavior_toggles" JSONB,
    "hand_style" TEXT NOT NULL DEFAULT 'Exploit',
    "hand_aggression_bias" INTEGER NOT NULL DEFAULT 85,
    "hand_insight_depth" TEXT NOT NULL DEFAULT 'Deep',
    "hand_behavior_toggles" JSONB,

    CONSTRAINT "UserAIConfig_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL DEFAULT '/month',
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "ai_limit" INTEGER NOT NULL DEFAULT 0,
    "name_ocr_limit" INTEGER NOT NULL DEFAULT 0,
    "hand_ocr_limit" INTEGER NOT NULL DEFAULT 0,
    "max_devices" INTEGER NOT NULL DEFAULT 1,
    "ocr_limit" INTEGER NOT NULL DEFAULT 0,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "color_theme" TEXT NOT NULL DEFAULT 'gold',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUsage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" "UsageActionType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Desktop App',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKeyDevice" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT,
    "ip_address" TEXT,
    "last_used" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKeyDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "playstyle" TEXT,
    "aggression_score" INTEGER NOT NULL DEFAULT 0,
    "looseness_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ai_playstyle" TEXT,
    "ai_aggression_level" TEXT,
    "ai_aggression_score" INTEGER,
    "ai_gto_baseline" TEXT,
    "ai_exploit_strategy" TEXT,
    "ai_stats_used" TEXT,
    "ai_analysis_mode" TEXT,
    "ai_range_matrix" JSONB,
    "ai_action_breakdown" JSONB,
    "ai_last_analyzed_at" TIMESTAMP(3),
    "ai_profile" JSONB,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerPattern" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "decay_score" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "note_type" TEXT NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "source" TEXT NOT NULL DEFAULT 'custom',
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "hand_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hand" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hand_hash" TEXT NOT NULL,
    "raw_input" TEXT NOT NULL DEFAULT '',
    "input_type" TEXT NOT NULL DEFAULT 'text',
    "parsed_data" JSONB,
    "ai_analysis" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "vpip" DOUBLE PRECISION,
    "rfi" DOUBLE PRECISION,
    "pfr" DOUBLE PRECISION,
    "three_bet" DOUBLE PRECISION,
    "fold_to_3bet" DOUBLE PRECISION,
    "cbet" DOUBLE PRECISION,
    "fold_to_cbet" DOUBLE PRECISION,
    "wtsd" DOUBLE PRECISION,
    "wsd" DOUBLE PRECISION,
    "aggression_freq" DOUBLE PRECISION,
    "steal" DOUBLE PRECISION,
    "fold_to_steal" DOUBLE PRECISION,
    "check_raise" DOUBLE PRECISION,
    "total_hands" INTEGER,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "ai_enabled" BOOLEAN NOT NULL DEFAULT false,
    "analysis_mode" TEXT NOT NULL DEFAULT 'simple',

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisContext" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "hero_stack" DOUBLE PRECISION NOT NULL,
    "villain_stack" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nowpayments_id" TEXT,
    "payment_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "actually_paid" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "tier_requested" "PremiumTier" NOT NULL,
    "is_upgraded" BOOLEAN NOT NULL DEFAULT false,
    "last_webhook_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature_valid" BOOLEAN,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hand_id" TEXT,
    "event_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GtoSpot" (
    "id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "board_bucket" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "action_line" TEXT,
    "turn_type" TEXT,
    "river_type" TEXT,
    "board" TEXT NOT NULL,
    "pot" DOUBLE PRECISION NOT NULL,
    "eff_stack" DOUBLE PRECISION NOT NULL,
    "oop_check" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oop_bet_small" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oop_bet_big" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ip_check" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ip_bet_small" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ip_bet_big" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oop_fold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oop_call" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oop_raise" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "GtoSpot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GtoHand" (
    "id" TEXT NOT NULL,
    "spot_id" TEXT NOT NULL,
    "player" TEXT NOT NULL,
    "hand" TEXT NOT NULL,
    "hand_class" TEXT NOT NULL,
    "check" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bet_small" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bet_big" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "call" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "raise" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "GtoHand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GtoQueryLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "board" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "hole_cards" TEXT NOT NULL,
    "action_history" TEXT,
    "ai_response" JSONB,
    "is_helpful" BOOLEAN,
    "feedback_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GtoQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_verify_token_key" ON "User"("email_verify_token");

-- CreateIndex
CREATE UNIQUE INDEX "User_reset_token_key" ON "User"("reset_token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_user_id_device_id_key" ON "Session"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserUsage_user_id_action_type_period_start_key" ON "UserUsage"("user_id", "action_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_hash_key" ON "ApiKey"("key_hash");

-- CreateIndex
CREATE INDEX "ApiKey_user_id_idx" ON "ApiKey"("user_id");

-- CreateIndex
CREATE INDEX "ApiKeyDevice_api_key_id_idx" ON "ApiKeyDevice"("api_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeyDevice_api_key_id_device_id_key" ON "ApiKeyDevice"("api_key_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_name_key" ON "Platform"("name");

-- CreateIndex
CREATE INDEX "Player_user_id_idx" ON "Player"("user_id");

-- CreateIndex
CREATE INDEX "Player_name_idx" ON "Player"("name");

-- CreateIndex
CREATE INDEX "Player_created_at_idx" ON "Player"("created_at");

-- CreateIndex
CREATE INDEX "Player_user_id_playstyle_idx" ON "Player"("user_id", "playstyle");

-- CreateIndex
CREATE UNIQUE INDEX "Player_user_id_platform_id_name_key" ON "Player"("user_id", "platform_id", "name");

-- CreateIndex
CREATE INDEX "PlayerPattern_player_id_idx" ON "PlayerPattern"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPattern_player_id_pattern_key" ON "PlayerPattern"("player_id", "pattern");

-- CreateIndex
CREATE INDEX "Note_user_id_idx" ON "Note"("user_id");

-- CreateIndex
CREATE INDEX "Note_player_id_idx" ON "Note"("player_id");

-- CreateIndex
CREATE INDEX "Note_user_id_created_at_idx" ON "Note"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Hand_hand_hash_key" ON "Hand"("hand_hash");

-- CreateIndex
CREATE INDEX "Hand_user_id_idx" ON "Hand"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Template_label_category_key" ON "Template"("label", "category");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_player_id_key" ON "PlayerStats"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_nowpayments_id_key" ON "Invoice"("nowpayments_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_payment_id_key" ON "Invoice"("payment_id");

-- CreateIndex
CREATE INDEX "SystemLog_user_id_idx" ON "SystemLog"("user_id");

-- CreateIndex
CREATE INDEX "SystemLog_hand_id_idx" ON "SystemLog"("hand_id");

-- CreateIndex
CREATE INDEX "SystemLog_created_at_idx" ON "SystemLog"("created_at");

-- CreateIndex
CREATE INDEX "GtoSpot_position_board_bucket_street_idx" ON "GtoSpot"("position", "board_bucket", "street");

-- CreateIndex
CREATE INDEX "GtoSpot_board_bucket_idx" ON "GtoSpot"("board_bucket");

-- CreateIndex
CREATE UNIQUE INDEX "GtoSpot_position_board_bucket_street_action_line_turn_type__key" ON "GtoSpot"("position", "board_bucket", "street", "action_line", "turn_type", "river_type");

-- CreateIndex
CREATE INDEX "GtoHand_spot_id_player_idx" ON "GtoHand"("spot_id", "player");

-- CreateIndex
CREATE INDEX "GtoHand_hand_class_idx" ON "GtoHand"("hand_class");

-- CreateIndex
CREATE INDEX "GtoHand_spot_id_player_hand_class_idx" ON "GtoHand"("spot_id", "player", "hand_class");

-- AddForeignKey
ALTER TABLE "UserAIConfig" ADD CONSTRAINT "UserAIConfig_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUsage" ADD CONSTRAINT "UserUsage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyDevice" ADD CONSTRAINT "ApiKeyDevice_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPattern" ADD CONSTRAINT "PlayerPattern_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "Hand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hand" ADD CONSTRAINT "Hand_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisContext" ADD CONSTRAINT "AnalysisContext_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "Hand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GtoHand" ADD CONSTRAINT "GtoHand_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "GtoSpot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
