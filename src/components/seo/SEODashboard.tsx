/**
 * SEO Performance Dashboard
 * Real-time monitoring and optimization recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logger as logger } from '@/lib/logger/edge';
import { 
  Search, 
  Zap, 
  Shield, 
  Image, 
  Smartphone, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { generateSEOReport, SEOMetrics } from '@/lib/seo/performance';

interface SEODashboardProps {
  className?: string;
}

export function SEODashboard({ className = '' }: SEODashboardProps) {
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [criticalIssues, setCriticalIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const analyzeSEO = async () => {
    setLoading(true);
    try {
      const report = await generateSEOReport();
      setMetrics(report.metrics);
      setRecommendations(report.recommendations);
      setCriticalIssues(report.criticalIssues);
      setLastUpdated(new Date());
    } catch (error) {
      logger.error('SEO analysis failed', error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeSEO();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'Good';
    if (score >= 70) return 'Needs Improvement';
    return 'Poor';
  };

  const formatTime = (milliseconds: number) => {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    return `${(milliseconds / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO Performance Dashboard
          </CardTitle>
          <CardDescription>Analyzing SEO performance...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>SEO Dashboard</CardTitle>
          <CardDescription>Failed to load SEO metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={analyzeSEO} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                SEO Performance Dashboard
              </CardTitle>
              <CardDescription>
                {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </CardDescription>
            </div>
            <Button onClick={analyzeSEO} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Critical Issues ({criticalIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {criticalIssues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              SEO Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span className={getScoreColor(metrics.seoScore)}>{metrics.seoScore}</span>
              <Badge variant={metrics.seoScore >= 90 ? 'default' : metrics.seoScore >= 70 ? 'secondary' : 'destructive'}>
                {getScoreBadge(metrics.seoScore)}
              </Badge>
            </div>
            <Progress value={metrics.seoScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span className={getScoreColor(metrics.performanceScore)}>{metrics.performanceScore}</span>
              <Badge variant={metrics.performanceScore >= 90 ? 'default' : metrics.performanceScore >= 70 ? 'secondary' : 'destructive'}>
                {getScoreBadge(metrics.performanceScore)}
              </Badge>
            </div>
            <Progress value={metrics.performanceScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span className={getScoreColor(metrics.accessibilityScore)}>{metrics.accessibilityScore}</span>
              <Badge variant={metrics.accessibilityScore >= 90 ? 'default' : metrics.accessibilityScore >= 70 ? 'secondary' : 'destructive'}>
                {getScoreBadge(metrics.accessibilityScore)}
              </Badge>
            </div>
            <Progress value={metrics.accessibilityScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Mobile Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span className={getScoreColor(metrics.mobileOptimization)}>{metrics.mobileOptimization}</span>
              <Badge variant={metrics.mobileOptimization >= 90 ? 'default' : metrics.mobileOptimization >= 70 ? 'secondary' : 'destructive'}>
                {getScoreBadge(metrics.mobileOptimization)}
              </Badge>
            </div>
            <Progress value={metrics.mobileOptimization} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="technical">Technical SEO</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">First Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-1">
                  {formatTime(metrics.webVitals.fcp)}
                </div>
                <Badge variant={metrics.webVitals.fcp < 1800 ? 'default' : metrics.webVitals.fcp < 3000 ? 'secondary' : 'destructive'}>
                  {metrics.webVitals.fcp < 1800 ? 'Good' : metrics.webVitals.fcp < 3000 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Largest Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-1">
                  {formatTime(metrics.webVitals.lcp)}
                </div>
                <Badge variant={metrics.webVitals.lcp < 2500 ? 'default' : metrics.webVitals.lcp < 4000 ? 'secondary' : 'destructive'}>
                  {metrics.webVitals.lcp < 2500 ? 'Good' : metrics.webVitals.lcp < 4000 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">First Input Delay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-1">
                  {formatTime(metrics.webVitals.fid)}
                </div>
                <Badge variant={metrics.webVitals.fid < 100 ? 'default' : metrics.webVitals.fid < 300 ? 'secondary' : 'destructive'}>
                  {metrics.webVitals.fid < 100 ? 'Good' : metrics.webVitals.fid < 300 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cumulative Layout Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-1">
                  {metrics.webVitals.cls.toFixed(3)}
                </div>
                <Badge variant={metrics.webVitals.cls < 0.1 ? 'default' : metrics.webVitals.cls < 0.25 ? 'secondary' : 'destructive'}>
                  {metrics.webVitals.cls < 0.1 ? 'Good' : metrics.webVitals.cls < 0.25 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Time to First Byte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-1">
                  {formatTime(metrics.webVitals.ttfb)}
                </div>
                <Badge variant={metrics.webVitals.ttfb < 600 ? 'default' : metrics.webVitals.ttfb < 1500 ? 'secondary' : 'destructive'}>
                  {metrics.webVitals.ttfb < 600 ? 'Good' : metrics.webVitals.ttfb < 1500 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Page Load Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-1">
                  {formatTime(metrics.pageLoadTime)}
                </div>
                <Badge variant={metrics.pageLoadTime < 3000 ? 'default' : metrics.pageLoadTime < 5000 ? 'secondary' : 'destructive'}>
                  {metrics.pageLoadTime < 3000 ? 'Fast' : metrics.pageLoadTime < 5000 ? 'Average' : 'Slow'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Technical SEO Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Structured Data</span>
                  {metrics.structuredDataValid ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Invalid
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Meta Tags</span>
                  {metrics.metaTagsComplete ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Incomplete
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Image Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-2">
                  {metrics.imageOptimization}%
                </div>
                <Progress value={metrics.imageOptimization} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Based on alt text, lazy loading, and modern formats
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    All SEO optimizations look good! Keep monitoring performance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Image Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Optimization</span>
                    <span className="text-sm font-bold">{metrics.imageOptimization}%</span>
                  </div>
                  <Progress value={metrics.imageOptimization} className="h-2" />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Optimization factors:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Alt text for accessibility and SEO</li>
                    <li>• Lazy loading for performance</li>
                    <li>• Modern formats (WebP, AVIF)</li>
                    <li>• Responsive images (srcset)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SEODashboard;