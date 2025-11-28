-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userId" TEXT NOT NULL,
    "universeKeywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notificationRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnalysisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "instagramHandle" TEXT,
    "tiktokHandle" TEXT,
    "twitterHandle" TEXT,
    "youtubeHandle" TEXT,
    "facebookHandle" TEXT,
    "focusSessionId" TEXT,
    "competitorSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandData" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,
    "scrapedData" TEXT,
    "followerCount" INTEGER,
    "postCount" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "avgPostPerDay" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "audienceComparison" TEXT NOT NULL,
    "postChannelData" TEXT NOT NULL,
    "hashtagAnalysis" TEXT NOT NULL,
    "postTypeEngagement" TEXT NOT NULL,
    "postTimingData" TEXT NOT NULL,
    "brandEquityData" TEXT NOT NULL,
    "keywordClustering" TEXT,
    "voiceAnalysis" TEXT,
    "shareOfVoice" TEXT,
    "aiInsights" TEXT,
    "aiKeywordInsights" TEXT,
    "additionalMetrics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramCache" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT,
    "followers" INTEGER NOT NULL,
    "following" INTEGER NOT NULL,
    "posts" INTEGER NOT NULL,
    "biography" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "profilePicUrl" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiktokCache" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "followers" INTEGER NOT NULL,
    "following" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "videos" INTEGER NOT NULL,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TiktokCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorProfile" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "platform" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "avgLikes" DOUBLE PRECISION,
    "avgComments" DOUBLE PRECISION,
    "avgShares" DOUBLE PRECISION,
    "engagementRate" DOUBLE PRECISION,
    "recentPosts" TEXT,
    "postFrequency" DOUBLE PRECISION,
    "categories" TEXT,
    "mentionCount" INTEGER NOT NULL DEFAULT 0,
    "lastMentionDate" TIMESTAMP(3),
    "sentiment" TEXT,
    "brandAlignmentScore" DOUBLE PRECISION,
    "collaborationScore" DOUBLE PRECISION,
    "priority" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileUrl" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,

    CONSTRAINT "AuthorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "text" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "mediaType" TEXT,
    "hashtags" TEXT,
    "mentions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "postUrl" TEXT,
    "postAuthor" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentAuthor" TEXT NOT NULL,
    "commentAuthorId" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "authorFollowers" INTEGER,
    "authorVerified" BOOLEAN NOT NULL DEFAULT false,
    "authorBio" TEXT,
    "sentiment" TEXT,
    "topics" TEXT,
    "isBrandMention" BOOLEAN NOT NULL DEFAULT false,
    "isQuestion" BOOLEAN NOT NULL DEFAULT false,
    "isComplaint" BOOLEAN NOT NULL DEFAULT false,
    "isPraise" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentAnalysis" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "avgCommentsPerPost" DOUBLE PRECISION,
    "positiveCount" INTEGER NOT NULL DEFAULT 0,
    "neutralCount" INTEGER NOT NULL DEFAULT 0,
    "negativeCount" INTEGER NOT NULL DEFAULT 0,
    "topCommenters" TEXT,
    "mostLikedComments" TEXT,
    "commentThemes" TEXT,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "praiseCount" INTEGER NOT NULL DEFAULT 0,
    "commonQuestions" TEXT,
    "peakCommentHours" TEXT,
    "avgResponseTime" DOUBLE PRECISION,
    "aiSummary" TEXT,
    "aiRecommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuznesiaClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuznesiaClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuznesiaCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuznesiaCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuznesiaInfluencer" (
    "id" TEXT NOT NULL,
    "socmedHandle" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "kolCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuznesiaInfluencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuznesiaContent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "sow" TEXT NOT NULL,
    "format" TEXT,
    "contentUrl" TEXT,
    "uploadDate" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "giftRevenue" DOUBLE PRECISION,
    "itemsSold" INTEGER,
    "linkInsight" TEXT,
    "linkBuildTapping" TEXT,
    "permission" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuznesiaContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AnalysisSession_userId_idx" ON "AnalysisSession"("userId");

-- CreateIndex
CREATE INDEX "AnalysisSession_status_idx" ON "AnalysisSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_focusSessionId_key" ON "Brand"("focusSessionId");

-- CreateIndex
CREATE INDEX "Brand_focusSessionId_idx" ON "Brand"("focusSessionId");

-- CreateIndex
CREATE INDEX "Brand_competitorSessionId_idx" ON "Brand"("competitorSessionId");

-- CreateIndex
CREATE INDEX "BrandData_brandId_idx" ON "BrandData"("brandId");

-- CreateIndex
CREATE INDEX "BrandData_platform_idx" ON "BrandData"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisResult_sessionId_key" ON "AnalysisResult"("sessionId");

-- CreateIndex
CREATE INDEX "AnalysisResult_sessionId_idx" ON "AnalysisResult"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramCache_username_key" ON "InstagramCache"("username");

-- CreateIndex
CREATE INDEX "InstagramCache_username_idx" ON "InstagramCache"("username");

-- CreateIndex
CREATE INDEX "InstagramCache_scrapedAt_idx" ON "InstagramCache"("scrapedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TiktokCache_username_key" ON "TiktokCache"("username");

-- CreateIndex
CREATE INDEX "TiktokCache_username_idx" ON "TiktokCache"("username");

-- CreateIndex
CREATE INDEX "TiktokCache_scrapedAt_idx" ON "TiktokCache"("scrapedAt");

-- CreateIndex
CREATE INDEX "AuthorProfile_sessionId_idx" ON "AuthorProfile"("sessionId");

-- CreateIndex
CREATE INDEX "AuthorProfile_platform_idx" ON "AuthorProfile"("platform");

-- CreateIndex
CREATE INDEX "AuthorProfile_username_idx" ON "AuthorProfile"("username");

-- CreateIndex
CREATE INDEX "AuthorProfile_collaborationScore_idx" ON "AuthorProfile"("collaborationScore");

-- CreateIndex
CREATE INDEX "AuthorPost_authorId_idx" ON "AuthorPost"("authorId");

-- CreateIndex
CREATE INDEX "AuthorPost_platform_idx" ON "AuthorPost"("platform");

-- CreateIndex
CREATE INDEX "AuthorPost_postId_idx" ON "AuthorPost"("postId");

-- CreateIndex
CREATE INDEX "PostComment_sessionId_idx" ON "PostComment"("sessionId");

-- CreateIndex
CREATE INDEX "PostComment_platform_idx" ON "PostComment"("platform");

-- CreateIndex
CREATE INDEX "PostComment_postAuthor_idx" ON "PostComment"("postAuthor");

-- CreateIndex
CREATE INDEX "PostComment_commentAuthor_idx" ON "PostComment"("commentAuthor");

-- CreateIndex
CREATE INDEX "PostComment_sentiment_idx" ON "PostComment"("sentiment");

-- CreateIndex
CREATE INDEX "PostComment_publishedAt_idx" ON "PostComment"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostComment_platform_commentId_key" ON "PostComment"("platform", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentAnalysis_sessionId_key" ON "CommentAnalysis"("sessionId");

-- CreateIndex
CREATE INDEX "CommentAnalysis_sessionId_idx" ON "CommentAnalysis"("sessionId");

-- CreateIndex
CREATE INDEX "BuznesiaClient_name_idx" ON "BuznesiaClient"("name");

-- CreateIndex
CREATE INDEX "BuznesiaCampaign_clientId_idx" ON "BuznesiaCampaign"("clientId");

-- CreateIndex
CREATE INDEX "BuznesiaCampaign_year_idx" ON "BuznesiaCampaign"("year");

-- CreateIndex
CREATE INDEX "BuznesiaCampaign_name_idx" ON "BuznesiaCampaign"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BuznesiaInfluencer_socmedHandle_key" ON "BuznesiaInfluencer"("socmedHandle");

-- CreateIndex
CREATE INDEX "BuznesiaInfluencer_platform_idx" ON "BuznesiaInfluencer"("platform");

-- CreateIndex
CREATE INDEX "BuznesiaInfluencer_tier_idx" ON "BuznesiaInfluencer"("tier");

-- CreateIndex
CREATE INDEX "BuznesiaInfluencer_socmedHandle_idx" ON "BuznesiaInfluencer"("socmedHandle");

-- CreateIndex
CREATE INDEX "BuznesiaInfluencer_kolCategory_idx" ON "BuznesiaInfluencer"("kolCategory");

-- CreateIndex
CREATE INDEX "BuznesiaContent_campaignId_idx" ON "BuznesiaContent"("campaignId");

-- CreateIndex
CREATE INDEX "BuznesiaContent_influencerId_idx" ON "BuznesiaContent"("influencerId");

-- AddForeignKey
ALTER TABLE "AnalysisSession" ADD CONSTRAINT "AnalysisSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_focusSessionId_fkey" FOREIGN KEY ("focusSessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_competitorSessionId_fkey" FOREIGN KEY ("competitorSessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandData" ADD CONSTRAINT "BrandData_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorProfile" ADD CONSTRAINT "AuthorProfile_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorPost" ADD CONSTRAINT "AuthorPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AuthorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentAnalysis" ADD CONSTRAINT "CommentAnalysis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuznesiaCampaign" ADD CONSTRAINT "BuznesiaCampaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BuznesiaClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuznesiaContent" ADD CONSTRAINT "BuznesiaContent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BuznesiaCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuznesiaContent" ADD CONSTRAINT "BuznesiaContent_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "BuznesiaInfluencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

