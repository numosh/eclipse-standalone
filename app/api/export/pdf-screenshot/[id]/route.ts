import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import puppeteer from 'puppeteer'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysisSession = await prisma.analysisSession.findFirst({
      where: {
        id: params.id,
        userId: (session.user as any).id
      },
      include: {
        focusBrand: true,
        competitors: true,
        analysisResult: true
      }
    })

    if (!analysisSession || !analysisSession.analysisResult) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    console.log('🚀 Starting comprehensive PDF generation with ALL graphics...')

    // Parse ALL analysis data
    const analysis = {
      brandEquity: JSON.parse(analysisSession.analysisResult.brandEquityData),
      audienceComparison: JSON.parse(analysisSession.analysisResult.audienceComparison),
      postChannelData: JSON.parse(analysisSession.analysisResult.postChannelData),
      hashtags: JSON.parse(analysisSession.analysisResult.hashtagAnalysis),
      postTypeEngagement: JSON.parse(analysisSession.analysisResult.postTypeEngagement),
      postTimingData: JSON.parse(analysisSession.analysisResult.postTimingData || '{}'),
      keywordClustering: analysisSession.analysisResult.keywordClustering ? JSON.parse(analysisSession.analysisResult.keywordClustering) : [],
      voiceAnalysis: analysisSession.analysisResult.voiceAnalysis ? JSON.parse(analysisSession.analysisResult.voiceAnalysis) : [],
      aiInsights: analysisSession.analysisResult.aiInsights || '',
      aiKeywordInsights: analysisSession.analysisResult.aiKeywordInsights || '',
      additionalMetrics: JSON.parse(analysisSession.analysisResult.additionalMetrics || '{}')
    }

    // Helper function to format numbers
    const formatNumber = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toString()
    }

    // Prepare audience chart data
    const audienceData = analysis.audienceComparison.flatMap((brand: any) =>
      brand.platforms.map((p: any) => ({
        brand: brand.brand,
        platform: p.platform,
        followers: p.followers || 0
      }))
    )
    const brands = analysis.audienceComparison.map((b: any) => b.brand)
    const platforms = [...new Set(audienceData.map((d: any) => d.platform))] as string[]

    // Platform colors
    const platformColors: any = {
      instagram: '#E4405F',
      tiktok: '#000000',
      twitter: '#1DA1F2',
      youtube: '#FF0000',
      facebook: '#1877F2'
    }

    // Generate comprehensive HTML with ALL charts and visualizations
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 50px 40px;
      background: white;
      color: #1F2937;
      line-height: 1.6;
    }
    .page-break { page-break-after: always; }

    /* Header Styles */
    h1 {
      color: #8B5CF6;
      font-size: 36px;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    h2 {
      color: #1F2937;
      font-size: 26px;
      margin-top: 50px;
      margin-bottom: 25px;
      font-weight: 700;
      border-bottom: 3px solid #8B5CF6;
      padding-bottom: 10px;
    }
    h3 {
      color: #374151;
      font-size: 20px;
      margin-top: 30px;
      margin-bottom: 18px;
      font-weight: 600;
    }
    h4 {
      color: #4B5563;
      font-size: 16px;
      margin-top: 20px;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .subtitle {
      color: #6B7280;
      font-size: 15px;
      margin-bottom: 50px;
      font-weight: 500;
    }

    /* Chart Containers */
    .chart-container {
      width: 100%;
      height: 450px;
      margin: 35px 0;
      page-break-inside: avoid;
      background: #F9FAFB;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .chart-small { height: 350px; }
    .chart-row {
      display: flex;
      gap: 25px;
      margin: 25px 0;
    }
    .chart-col {
      flex: 1;
      background: #F9FAFB;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    th {
      background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
      font-weight: 600;
      color: white;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      font-size: 14px;
      color: #374151;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #F9FAFB; }

    /* Metric Cards */
    .metric-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .metric-card {
      background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    .metric-card .label {
      color: #6B7280;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .metric-card .value {
      color: #1F2937;
      font-size: 28px;
      font-weight: 700;
    }

    /* Insights Box */
    .insights {
      background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
      padding: 25px;
      border-radius: 12px;
      margin: 25px 0;
      white-space: pre-wrap;
      border-left: 5px solid #3B82F6;
      font-size: 14px;
      line-height: 1.8;
      color: #1F2937;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .insights strong {
      color: #1E40AF;
    }

    /* Keyword Clusters */
    .cluster-box {
      background: white;
      border: 2px solid #D1FAE5;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    .cluster-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 12px;
      border-bottom: 2px solid #10B981;
    }
    .cluster-title {
      font-size: 18px;
      font-weight: 700;
      color: #065F46;
    }
    .cluster-stats {
      background: #D1FAE5;
      padding: 8px 15px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #065F46;
    }
    .keyword-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 15px 0;
    }
    .keyword-tag {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
    }

    /* Hashtag Tags */
    .hashtag-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 25px 0;
    }
    .hashtag-box {
      background: linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%);
      padding: 20px;
      border-radius: 12px;
      border: 2px solid #E9D5FF;
    }
    .hashtag-box h4 {
      color: #6B21A8;
      margin-bottom: 15px;
      font-size: 18px;
    }
    .hashtag-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .hashtag-tag {
      background: linear-gradient(135deg, #A855F7 0%, #9333EA 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(168, 85, 247, 0.3);
    }

    /* Footer */
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #E5E7EB;
      text-align: center;
      color: #9CA3AF;
      font-size: 12px;
    }

    @media print {
      .chart-container, .cluster-box, .insights {
        page-break-inside: avoid;
      }
      body {
        padding: 30px 25px;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div style="text-align: center; padding: 100px 0;">
    <h1 style="font-size: 48px; margin-bottom: 20px;">${analysisSession.title}</h1>
    <div class="subtitle" style="font-size: 18px; margin-bottom: 30px;">
      Comprehensive Brand Analysis Report
    </div>
    <div class="subtitle" style="font-size: 16px;">
      Generated on ${new Date(analysisSession.completedAt!).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })}
    </div>
    <div style="margin-top: 60px;">
      <div class="metric-cards" style="max-width: 800px; margin: 0 auto;">
        <div class="metric-card">
          <div class="label">Brands</div>
          <div class="value">${analysis.additionalMetrics.totalBrandsAnalyzed}</div>
        </div>
        <div class="metric-card">
          <div class="label">Platforms</div>
          <div class="value">${analysis.additionalMetrics.totalPlatforms}</div>
        </div>
        <div class="metric-card">
          <div class="label">Period</div>
          <div class="value" style="font-size: 16px;">${analysis.additionalMetrics.dataRange}</div>
        </div>
        <div class="metric-card">
          <div class="label">Visualizations</div>
          <div class="value">${8 + analysis.postTypeEngagement.length + (analysis.keywordClustering.length || 0)}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- Executive Summary -->
  <h2>📊 Executive Summary</h2>
  <div class="metric-cards">
    <div class="metric-card" style="background: linear-gradient(135deg, #DDD6FE 0%, #C4B5FD 100%);">
      <div class="label" style="color: #6B21A8;">Total Followers</div>
      <div class="value" style="color: #6B21A8;">${formatNumber(
        analysis.brandEquity.reduce((sum: number, b: any) => sum + b.totalFollowers, 0)
      )}</div>
    </div>
    <div class="metric-card" style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);">
      <div class="label" style="color: #1E40AF;">Avg Engagement</div>
      <div class="value" style="color: #1E40AF;">${(
        analysis.brandEquity.reduce((sum: number, b: any) => sum + b.avgEngagement, 0) /
        analysis.brandEquity.length
      ).toFixed(2)}%</div>
    </div>
    <div class="metric-card" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);">
      <div class="label" style="color: #065F46;">Content Velocity</div>
      <div class="value" style="color: #065F46;">${(
        analysis.brandEquity.reduce((sum: number, b: any) => sum + b.contentVelocity, 0) /
        analysis.brandEquity.length
      ).toFixed(1)}/day</div>
    </div>
    <div class="metric-card" style="background: linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%);">
      <div class="label" style="color: #9A3412;">Equity Score</div>
      <div class="value" style="color: #9A3412;">${(
        analysis.brandEquity.reduce((sum: number, b: any) => sum + b.equityScore, 0) /
        analysis.brandEquity.length
      ).toFixed(1)}</div>
    </div>
  </div>

  <!-- Brand Equity Analysis -->
  <h2>🏆 Brand Equity Comparison</h2>
  <p style="color: #6B7280; margin-bottom: 20px;">Comprehensive brand performance metrics: reach, engagement, and content activity</p>

  <div class="chart-container">
    <canvas id="brandEquityRadarChart"></canvas>
  </div>

  <table>
    <thead>
      <tr>
        <th>Brand</th>
        <th>Total Followers</th>
        <th>Avg Engagement</th>
        <th>Content Velocity</th>
        <th>Equity Score</th>
      </tr>
    </thead>
    <tbody>
      ${analysis.brandEquity.map((b: any) => `
        <tr>
          <td><strong>${b.brand}</strong></td>
          <td>${b.totalFollowers.toLocaleString()}</td>
          <td>${b.avgEngagement.toFixed(2)}%</td>
          <td>${b.contentVelocity.toFixed(2)}/day</td>
          <td><strong>${b.equityScore.toFixed(1)}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="chart-container chart-small">
    <canvas id="brandEquityBarChart"></canvas>
  </div>

  <div class="page-break"></div>

  <!-- Audience Comparison -->
  <h2>👥 Audience Comparison by Platform</h2>
  <p style="color: #6B7280; margin-bottom: 20px;">Total follower count across different social media platforms</p>

  <div class="chart-container">
    <canvas id="audienceChart"></canvas>
  </div>

  <table>
    <thead>
      <tr>
        <th>Brand</th>
        ${platforms.map(p => `<th>${p.charAt(0).toUpperCase() + p.slice(1)}</th>`).join('')}
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${brands.map((brand: string) => {
        const brandData = audienceData.filter((d: any) => d.brand === brand)
        const total = brandData.reduce((sum: number, d: any) => sum + d.followers, 0)
        return `
          <tr>
            <td><strong>${brand}</strong></td>
            ${platforms.map(platform => {
              const data = brandData.find((d: any) => d.platform === platform)
              return `<td>${data ? formatNumber(data.followers) : '-'}</td>`
            }).join('')}
            <td><strong>${formatNumber(total)}</strong></td>
          </tr>
        `
      }).join('')}
    </tbody>
  </table>

  ${analysis.voiceAnalysis && analysis.voiceAnalysis.length > 0 ? `
    <div class="page-break"></div>

    <!-- Voice Analysis -->
    <h2>🎙️ Own & Earn Voice Analysis</h2>
    <p style="color: #6B7280; margin-bottom: 20px;">Analysis of brand-created content vs. user-generated conversations about the brand</p>

    <div class="chart-container">
      <canvas id="voiceComparisonChart"></canvas>
    </div>

    <table>
      <thead>
        <tr>
          <th>Brand</th>
          <th>Own Posts</th>
          <th>Own Engagement</th>
          <th>Earned Mentions</th>
          <th>Earned Engagement</th>
          <th>Voice Ratio</th>
          <th>Amplification</th>
        </tr>
      </thead>
      <tbody>
        ${analysis.voiceAnalysis.map((v: any) => `
          <tr>
            <td><strong>${v.brand}</strong></td>
            <td>${v.metrics.ownVoice.totalPosts.toLocaleString()}</td>
            <td>${formatNumber(v.metrics.ownVoice.totalEngagement)}</td>
            <td>${v.metrics.earnVoice.totalMentions.toLocaleString()}</td>
            <td>${formatNumber(v.metrics.earnVoice.totalEngagement)}</td>
            <td><strong>${v.metrics.voiceRatio.toFixed(2)}x</strong></td>
            <td><strong>${v.metrics.amplificationFactor.toFixed(2)}x</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="chart-container chart-small">
      <canvas id="voiceRatioChart"></canvas>
    </div>
  ` : ''}

  <div class="page-break"></div>

  <!-- Post Channel Distribution -->
  <h2>📱 Post Channel Distribution</h2>
  <p style="color: #6B7280; margin-bottom: 20px;">Distribution of posts across different platforms by brand</p>

  <div class="chart-container">
    <canvas id="postChannelChart"></canvas>
  </div>

  <!-- Hashtag Analysis -->
  <h2>🏷️ Top Hashtags Analysis</h2>
  <p style="color: #6B7280; margin-bottom: 20px;">Most frequently used hashtags by each brand (Last 30 Days)</p>

  <div class="hashtag-section">
    ${analysis.hashtags.map((brand: any) => `
      <div class="hashtag-box">
        <h4>${brand.brand}</h4>
        <div class="hashtag-tags">
          ${brand.topHashtags.length > 0 ?
            brand.topHashtags.slice(0, 10).map((tag: string) =>
              `<span class="hashtag-tag">${tag}</span>`
            ).join('') :
            '<span style="color: #9CA3AF; font-style: italic;">No hashtags found</span>'}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="page-break"></div>

  <!-- Post Type Engagement -->
  <h2>📊 Post Type & Engagement Analysis</h2>
  <p style="color: #6B7280; margin-bottom: 20px;">Performance analysis by content type</p>

  ${analysis.postTypeEngagement.map((brand: any, idx: number) => `
    <h3>${brand.brand}</h3>
    <div class="chart-container chart-small">
      <canvas id="postTypeChart${idx}"></canvas>
    </div>
  `).join('')}

  <!-- Post Timing Analysis -->
  ${analysis.postTimingData && analysis.postTimingData.focusBrand ? `
    <div class="page-break"></div>

    <h2>⏰ Optimal Post Timing Analysis</h2>
    <p style="color: #6B7280; margin-bottom: 20px;">When brands are posting content (24-hour format)</p>

    <h3>Focus Brand: ${analysis.postTimingData.focusBrand.brandName}</h3>
    ${Object.entries(analysis.postTimingData.focusBrand.platforms).map(([platform, data]: [string, any], idx: number) => `
      <h4>${platform.charAt(0).toUpperCase() + platform.slice(1)}</h4>
      <div class="chart-container chart-small">
        <canvas id="timingChart${idx}"></canvas>
      </div>
    `).join('')}
  ` : ''}

  ${analysis.keywordClustering && analysis.keywordClustering.length > 0 ? `
    <div class="page-break"></div>

    <!-- Keyword Clustering -->
    <h2>🔤 Keyword Clustering & Conversation Analysis</h2>
    <p style="color: #6B7280; margin-bottom: 20px;">Conversation analysis based on keyword clustering from recent posts per channel</p>

    ${analysis.keywordClustering.map((brandKw: any) => `
      <h3>${brandKw.brand} - ${brandKw.platform.toUpperCase()}</h3>
      <p style="color: #6B7280; font-size: 14px; margin-bottom: 20px;">
        ${brandKw.totalPosts} posts analyzed • ${brandKw.clusters.length} clusters identified
      </p>

      <div style="background: #F0FDF4; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <strong style="color: #065F46;">Top Keywords:</strong>
        <div class="keyword-tags" style="margin-top: 10px;">
          ${brandKw.topKeywords.slice(0, 15).map((kw: any) =>
            `<span class="keyword-tag">${kw.keyword} (${kw.frequency}x)</span>`
          ).join('')}
        </div>
      </div>

      ${brandKw.clusters.slice(0, 5).map((cluster: any, cidx: number) => `
        <div class="cluster-box">
          <div class="cluster-header">
            <div class="cluster-title">Cluster #${cidx + 1}: "${cluster.topKeyword}"</div>
            <div class="cluster-stats">${cluster.postCount} posts • ${formatNumber(Math.round(cluster.averageEngagement))} avg eng.</div>
          </div>
          <p style="color: #6B7280; font-style: italic; margin-bottom: 12px;">${cluster.theme}</p>
          <div class="keyword-tags">
            ${cluster.keywords.map((keyword: string) =>
              `<span class="keyword-tag">${keyword}</span>`
            ).join('')}
          </div>
        </div>
      `).join('')}
    `).join('')}
  ` : ''}

  ${analysis.aiKeywordInsights ? `
    <div class="page-break"></div>

    <h2>💡 AI Insights: Keyword & Conversation Analysis</h2>
    <div class="insights">
${analysis.aiKeywordInsights}
    </div>
  ` : ''}

  ${analysis.aiInsights ? `
    <div class="page-break"></div>

    <h2>🤖 AI-Generated Strategic Insights</h2>
    <div class="insights">
${analysis.aiInsights}
    </div>
  ` : ''}

  <div class="footer">
    <p><strong>Eclipse Brand Analysis Platform</strong></p>
    <p>Generated with advanced analytics and AI-powered insights</p>
    <p style="margin-top: 10px;">Data sources: TMS API • RIVAL IQ • Playwright Scraping • Ollama AI</p>
  </div>

  <script>
    // Disable animations for faster rendering and PDF compatibility
    Chart.defaults.animation = false;
    Chart.defaults.animations = false;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;

    // Color palette
    const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];
    const platformColors = ${JSON.stringify(platformColors)};

    // Brand Equity Radar Chart - prepare data with colors
    const brandEquityRadarDatasets = [
      ${analysis.brandEquity.map((b: any, idx: number) => `{
        label: '${b.brand}',
        data: [
          ${Math.min(100, (b.totalFollowers / 100000) * 100)},
          ${Math.min(100, b.avgEngagement * 10)},
          ${Math.min(100, b.contentVelocity * 20)},
          ${b.equityScore}
        ],
        borderColor: colors[${idx % 8}],
        backgroundColor: colors[${idx % 8}] + '40',
        borderWidth: 2
      }`).join(',\n')}
    ];

    const brandEquityRadarData = {
      labels: ['Reach', 'Engagement', 'Content Velocity', 'Equity Score'],
      datasets: brandEquityRadarDatasets
    };
    new Chart(document.getElementById('brandEquityRadarChart'), {
      type: 'radar',
      data: brandEquityRadarData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 20 }
          }
        },
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Brand Performance Radar', font: { size: 16, weight: 'bold' } }
        }
      }
    });

    // Brand Equity Bar Chart
    new Chart(document.getElementById('brandEquityBarChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(analysis.brandEquity.map((b: any) => b.brand))},
        datasets: [{
          label: 'Equity Score',
          data: ${JSON.stringify(analysis.brandEquity.map((b: any) => b.equityScore))},
          backgroundColor: colors[0],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Brand Equity Scores Comparison', font: { size: 16, weight: 'bold' } }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });

    // Audience Comparison Chart - prepare datasets with colors
    const audienceDatasets = [
      ${platforms.map((platform: string, idx: number) => {
        const color = platformColors[platform] || ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'][idx % 8]
        return `{
          label: '${platform.charAt(0).toUpperCase() + platform.slice(1)}',
          data: [${brands.map((brand: string) => {
            const data = audienceData.find((d: any) => d.brand === brand && d.platform === platform)
            return data ? data.followers : 0
          }).join(', ')}],
          backgroundColor: '${color}',
          borderRadius: 6
        }`
      }).join(',\n')}
    ];

    new Chart(document.getElementById('audienceChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(brands)},
        datasets: audienceDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Audience Size by Platform', font: { size: 16, weight: 'bold' } }
        },
        scales: {
          x: { stacked: false },
          y: { stacked: false, beginAtZero: true }
        }
      }
    });

    ${analysis.voiceAnalysis && analysis.voiceAnalysis.length > 0 ? `
      // Voice Comparison Chart
      new Chart(document.getElementById('voiceComparisonChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(analysis.voiceAnalysis.map((v: any) => v.brand))},
          datasets: [
            {
              label: 'Own Voice (Posts)',
              data: ${JSON.stringify(analysis.voiceAnalysis.map((v: any) => v.metrics.ownVoice.totalPosts))},
              backgroundColor: colors[0],
              borderRadius: 6
            },
            {
              label: 'Earn Voice (Mentions)',
              data: ${JSON.stringify(analysis.voiceAnalysis.map((v: any) => v.metrics.earnVoice.totalMentions))},
              backgroundColor: colors[2],
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Own vs. Earn Voice Comparison', font: { size: 16, weight: 'bold' } }
          },
          scales: { y: { beginAtZero: true } }
        }
      });

      // Voice Ratio Chart
      new Chart(document.getElementById('voiceRatioChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(analysis.voiceAnalysis.map((v: any) => v.brand))},
          datasets: [
            {
              label: 'Voice Ratio',
              data: ${JSON.stringify(analysis.voiceAnalysis.map((v: any) => v.metrics.voiceRatio))},
              backgroundColor: colors[4],
              borderRadius: 6,
              yAxisID: 'y'
            },
            {
              label: 'Amplification Factor',
              data: ${JSON.stringify(analysis.voiceAnalysis.map((v: any) => v.metrics.amplificationFactor))},
              backgroundColor: colors[5],
              borderRadius: 6,
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Voice Ratio & Amplification Metrics', font: { size: 16, weight: 'bold' } }
          },
          scales: {
            y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Ratio (x)' } }
          }
        }
      });
    ` : ''}

    // Post Channel Chart
    const postChannelData = ${JSON.stringify(analysis.postChannelData.flatMap((brand: any) =>
      brand.channels.map((c: any) => ({
        label: brand.brand + ' - ' + c.platform,
        value: c.totalPosts || 1,
        brand: brand.brand,
        platform: c.platform
      }))
    ))};

    new Chart(document.getElementById('postChannelChart'), {
      type: 'pie',
      data: {
        labels: postChannelData.map((d: any) => d.label),
        datasets: [{
          data: postChannelData.map((d: any) => d.value),
          backgroundColor: postChannelData.map((d: any, idx: number) => colors[idx % colors.length]),
          borderWidth: 2,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 15, padding: 10 } },
          title: { display: true, text: 'Post Distribution Across Channels', font: { size: 16, weight: 'bold' } }
        }
      }
    });

    // Post Type Engagement Charts
    ${analysis.postTypeEngagement.map((brand: any, idx: number) => `
      new Chart(document.getElementById('postTypeChart${idx}'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(brand.postTypes.map((pt: any) => pt.type))},
          datasets: [
            {
              label: 'Post Count',
              data: ${JSON.stringify(brand.postTypes.map((pt: any) => pt.count))},
              backgroundColor: colors[1],
              borderRadius: 6,
              yAxisID: 'y'
            },
            {
              label: 'Avg Engagement',
              data: ${JSON.stringify(brand.postTypes.map((pt: any) => pt.avgEngagement))},
              backgroundColor: colors[2],
              borderRadius: 6,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: '${brand.brand} - Content Type Performance', font: { size: 14, weight: 'bold' } }
          },
          scales: {
            y: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: 'Post Count' } },
            y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: 'Avg Engagement' } }
          }
        }
      });
    `).join('\n')}

    // Post Timing Charts
    ${analysis.postTimingData && analysis.postTimingData.focusBrand ?
      Object.entries(analysis.postTimingData.focusBrand.platforms).map(([platform, data]: [string, any], idx: number) => `
        new Chart(document.getElementById('timingChart${idx}'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify((data as any).postTimes.map((pt: any) => pt.hour))},
            datasets: [{
              label: 'Number of Posts',
              data: ${JSON.stringify((data as any).postTimes.map((pt: any) => pt.count))},
              borderColor: colors[0],
              backgroundColor: colors[0] + '20',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: '${platform} - Posting Schedule', font: { size: 14, weight: 'bold' } }
            },
            scales: {
              x: { title: { display: true, text: 'Hour of Day (24h)' } },
              y: { beginAtZero: true, title: { display: true, text: 'Post Count' } }
            }
          }
        });
      `).join('\n')
    : ''}
  </script>
</body>
</html>
    `

    console.log('🚀 Launching Puppeteer browser...')

    // Launch Puppeteer with optimized settings
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    // Set viewport for better rendering
    await page.setViewport({ width: 1200, height: 1600 })

    console.log('📄 Setting page content...')

    // Set content and wait for network to be idle
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })

    console.log('⏳ Waiting for Chart.js to load...')

    // Wait for Chart.js library to load
    await page.waitForFunction('typeof window.Chart !== "undefined"', { timeout: 30000 })

    console.log('📊 Chart.js loaded! Waiting for all charts to render...')

    // Wait for all canvas elements to be present
    await page.waitForSelector('canvas', { timeout: 15000 })

    // Count expected charts
    const expectedCharts = await page.evaluate(() => {
      return document.querySelectorAll('canvas').length
    })

    console.log(`Found ${expectedCharts} canvas elements, waiting for charts to render...`)

    // Give extra time for all charts to render and animate
    await new Promise(resolve => setTimeout(resolve, 8000))

    // Verify charts are actually rendered (have content)
    const renderedCharts = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas')
      let rendered = 0
      canvases.forEach(canvas => {
        const ctx = (canvas as HTMLCanvasElement).getContext('2d')
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          // Check if canvas has any non-transparent pixels
          const hasContent = imageData.data.some((pixel, idx) => idx % 4 === 3 && pixel > 0)
          if (hasContent) rendered++
        }
      })
      return rendered
    })

    console.log(`✅ ${renderedCharts}/${expectedCharts} charts rendered successfully!`)

    console.log('📄 Generating PDF...')

    // Generate PDF with high quality settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      preferCSSPageSize: false,
      displayHeaderFooter: false
    })

    await browser.close()

    console.log('✅ PDF generation with all graphics complete!')

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${analysisSession.title}_analysis_full.pdf"`
      }
    })
  } catch (error) {
    console.error('❌ Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: (error as Error).message },
      { status: 500 }
    )
  }
}
