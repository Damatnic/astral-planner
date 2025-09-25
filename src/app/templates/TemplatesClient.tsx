'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package,
  Plus,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Heart,
  Users,
  Clock,
  Sparkles,
  ChevronRight,
  Grid3X3,
  List,
  TrendingUp,
  Award,
  Bookmark,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'business' | 'education' | 'health' | 'creative' | 'development' | 'personal';
  tags: string[];
  isPublic: boolean;
  isPro: boolean;
  previewImage?: string;
  usageCount: number;
  likeCount: number;
  rating: number;
  viewCount: number;
  isLiked: boolean;
  hasUsed: boolean;
  author: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  };
  content: {
    workspaces?: any[];
    blocks?: any[];
    goals?: any[];
    habits?: any[];
    settings?: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

interface TemplatesData {
  templates: Template[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  loading: boolean;
  error?: string;
}

const templateCategories = [
  { value: 'productivity', label: 'Productivity', icon: '⚡', color: 'blue' },
  { value: 'business', label: 'Business', icon: '💼', color: 'purple' },
  { value: 'education', label: 'Education', icon: '🎓', color: 'green' },
  { value: 'health', label: 'Health', icon: '🏥', color: 'red' },
  { value: 'creative', label: 'Creative', icon: '🎨', color: 'pink' },
  { value: 'development', label: 'Development', icon: '💻', color: 'orange' },
  { value: 'personal', label: 'Personal', icon: '👤', color: 'gray' }
];

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'recent', label: 'Recently Added' }
];

export default function TemplatesPage() {
  // Mock user for development without authentication
  const user = { id: 'test-user', firstName: 'Test', lastName: 'User' };
  const [data, setData] = useState<TemplatesData>({
    templates: [],
    pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
    loading: true
  });
  const [view, setView] = useState('grid');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyTemplates, setShowMyTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [installOptions, setInstallOptions] = useState({
    includeWorkspaces: true,
    includeBlocks: true,
    includeGoals: true,
    includeHabits: true,
    includeSettings: false,
    workspaceName: ''
  });

  // Fetch templates data
  useEffect(() => {
    async function fetchTemplates() {
      if (!user) return;

      try {
        setData(prev => ({ ...prev, loading: true }));

        const params = new URLSearchParams({
          category: category !== 'all' ? category : '',
          search: searchTerm,
          sortBy,
          userTemplates: showMyTemplates.toString(),
          limit: '20',
          offset: '0'
        });

        const response = await fetch(`/api/templates?${params}`);
        const result = await response.json();

        if (response.ok) {
          setData({
            templates: result.templates || [],
            pagination: result.pagination || { total: 0, limit: 20, offset: 0, hasMore: false },
            loading: false
          });
        } else {
          throw new Error(result.error || 'Failed to fetch templates');
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load templates'
        }));
      }
    }

    fetchTemplates();
  }, [user, category, sortBy, searchTerm, showMyTemplates]);

  // Like/Unlike template
  async function handleToggleLike(templateId: string, currentlyLiked: boolean) {
    try {
      const method = currentlyLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/templates/${templateId}/like`, { method });
      
      if (response.ok) {
        setData(prev => ({
          ...prev,
          templates: prev.templates.map(template =>
            template.id === templateId
              ? {
                  ...template,
                  isLiked: !currentlyLiked,
                  likeCount: currentlyLiked ? template.likeCount - 1 : template.likeCount + 1
                }
              : template
          )
        }));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }

  // Install template
  async function handleInstallTemplate() {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`/api/templates/${selectedTemplate.id}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceName: installOptions.workspaceName || selectedTemplate.name,
          installOptions
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowInstallDialog(false);
        setSelectedTemplate(null);
        
        // Show success message
        alert(`Template installed successfully! ${result.totalItems} items added.`);
        
        // Mark template as used
        setData(prev => ({
          ...prev,
          templates: prev.templates.map(template =>
            template.id === selectedTemplate.id
              ? { ...template, hasUsed: true, usageCount: template.usageCount + 1 }
              : template
          )
        }));
      } else {
        const error = await response.json();
        console.error('Failed to install template:', error);
        alert('Failed to install template. Please try again.');
      }
    } catch (error) {
      console.error('Failed to install template:', error);
      alert('Failed to install template. Please try again.');
    }
  }

  // Get category config
  function getCategoryConfig(categoryValue: string) {
    return templateCategories.find(c => c.value === categoryValue) || templateCategories[0];
  }

  // Render template card
  function renderTemplateCard(template: Template) {
    const categoryConfig = getCategoryConfig(template.category);

    return (
      <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <CardContent className="p-4">
          {/* Template Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-${categoryConfig.color}-100 text-${categoryConfig.color}-600`}
              >
                {categoryConfig.icon}
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-muted-foreground">by {template.author}</p>
              </div>
            </div>

            {template.isPro && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Star className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            )}
          </div>

          {/* Preview Image */}
          {template.previewImage ? (
            <div className="mb-3 overflow-hidden rounded-lg">
              <img 
                src={template.previewImage} 
                alt={template.name}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          ) : (
            <div className="mb-3 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center">
              <Package className="h-12 w-12 text-primary/50" />
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {template.usageCount}
            </div>
            <div className="flex items-center gap-1">
              <Heart className={`h-3 w-3 ${template.isLiked ? 'text-red-500 fill-current' : ''}`} />
              {template.likeCount}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              {template.rating.toFixed(1)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                setSelectedTemplate(template);
                setShowPreviewDialog(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleLike(template.id, template.isLiked)}
              className={template.isLiked ? 'text-red-500 border-red-200' : ''}
            >
              <Heart className={`h-4 w-4 ${template.isLiked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => {
                setSelectedTemplate(template);
                setInstallOptions(prev => ({
                  ...prev,
                  workspaceName: template.name
                }));
                setShowInstallDialog(true);
              }}
              disabled={template.hasUsed}
            >
              {template.hasUsed ? (
                <>
                  <Award className="h-4 w-4 mr-1" />
                  Installed
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Use
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Templates</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/templates/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Link>
            </Button>
            <Button
              variant={showMyTemplates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMyTemplates(!showMyTemplates)}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              My Templates
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Template Marketplace</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover and install productivity templates created by the community. 
            Jump-start your workflow with proven systems and structures.
          </p>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Button
              variant={category === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory('all')}
            >
              All Templates
            </Button>
            {templateCategories.map(cat => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat.value)}
                className="flex items-center gap-1"
              >
                <span>{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={view === 'grid' ? "default" : "outline"}
              size="sm"
              onClick={() => setView('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? "default" : "outline"}
              size="sm"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            {data.loading ? 'Loading...' : `${data.pagination.total} template${data.pagination.total !== 1 ? 's' : ''} found`}
          </p>
          {showMyTemplates && (
            <Badge variant="outline">Showing your templates</Badge>
          )}
        </div>

        {/* Templates Grid */}
        <div className="space-y-6">
          {data.loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data.error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{data.error}</p>
              </CardContent>
            </Card>
          ) : data.templates.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.templates.map(template => renderTemplateCard(template))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  {showMyTemplates ? 'No templates created yet' : 'No templates found'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {showMyTemplates 
                    ? 'Create your first template to share with the community'
                    : 'Try adjusting your search criteria or browse different categories'
                  }
                </p>
                {showMyTemplates && (
                  <Button asChild>
                    <Link href="/templates/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Load More */}
        {data.pagination.hasMore && (
          <div className="text-center mt-8">
            <Button variant="outline">
              Load More Templates
            </Button>
          </div>
        )}

        {/* Template Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedTemplate && (
                  <>
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-${getCategoryConfig(selectedTemplate.category).color}-100 text-${getCategoryConfig(selectedTemplate.category).color}-600`}
                    >
                      {getCategoryConfig(selectedTemplate.category).icon}
                    </div>
                    {selectedTemplate.name}
                    {selectedTemplate.isPro && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        PRO
                      </Badge>
                    )}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate?.description}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTemplate && (
              <div className="space-y-6">
                {/* Author Info */}
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Avatar>
                    <AvatarImage src={selectedTemplate.creator?.imageUrl} />
                    <AvatarFallback>
                      {selectedTemplate.author.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedTemplate.author}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {format(parseISO(selectedTemplate.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Template Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Download className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <div className="font-bold">{selectedTemplate.usageCount}</div>
                    <div className="text-xs text-muted-foreground">Uses</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Heart className="h-5 w-5 mx-auto mb-1 text-red-600" />
                    <div className="font-bold">{selectedTemplate.likeCount}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Star className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                    <div className="font-bold">{selectedTemplate.rating.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Eye className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <div className="font-bold">{selectedTemplate.viewCount}</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                </div>

                {/* Template Content Preview */}
                <div className="space-y-4">
                  <h4 className="font-medium">What's included:</h4>
                  
                  {selectedTemplate.content.workspaces && selectedTemplate.content.workspaces.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Grid3X3 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Workspaces ({selectedTemplate.content.workspaces.length})</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pre-configured workspaces with organized layouts
                      </p>
                    </div>
                  )}

                  {selectedTemplate.content.goals && selectedTemplate.content.goals.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Goals ({selectedTemplate.content.goals.length})</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Goal templates with target values and milestones
                      </p>
                    </div>
                  )}

                  {selectedTemplate.content.habits && selectedTemplate.content.habits.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Habits ({selectedTemplate.content.habits.length})</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Daily and weekly habit templates
                      </p>
                    </div>
                  )}

                  {selectedTemplate.content.blocks && selectedTemplate.content.blocks.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Tasks/Blocks ({selectedTemplate.content.blocks.length})</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pre-built task templates and content blocks
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <h4 className="font-medium mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleToggleLike(selectedTemplate.id, selectedTemplate.isLiked)}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${selectedTemplate.isLiked ? 'fill-current text-red-500' : ''}`} />
                    {selectedTemplate.isLiked ? 'Unlike' : 'Like'} ({selectedTemplate.likeCount})
                  </Button>
                  
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      setShowPreviewDialog(false);
                      setInstallOptions(prev => ({
                        ...prev,
                        workspaceName: selectedTemplate.name
                      }));
                      setShowInstallDialog(true);
                    }}
                    disabled={selectedTemplate.hasUsed}
                  >
                    {selectedTemplate.hasUsed ? (
                      <>
                        <Award className="h-4 w-4 mr-2" />
                        Already Installed
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Install Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Install Template Dialog */}
        <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Install Template</DialogTitle>
              <DialogDescription>
                Choose what to install from "{selectedTemplate?.name}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input
                  id="workspaceName"
                  value={installOptions.workspaceName}
                  onChange={(e) => setInstallOptions(prev => ({ ...prev, workspaceName: e.target.value }))}
                  placeholder="Enter workspace name"
                />
              </div>

              <div className="space-y-3">
                <Label>What to install:</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="workspaces"
                    checked={installOptions.includeWorkspaces}
                    onCheckedChange={(checked) => 
                      setInstallOptions(prev => ({ ...prev, includeWorkspaces: checked as boolean }))
                    }
                  />
                  <Label htmlFor="workspaces">Workspaces and layouts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="blocks"
                    checked={installOptions.includeBlocks}
                    onCheckedChange={(checked) => 
                      setInstallOptions(prev => ({ ...prev, includeBlocks: checked as boolean }))
                    }
                  />
                  <Label htmlFor="blocks">Tasks and content blocks</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="goals"
                    checked={installOptions.includeGoals}
                    onCheckedChange={(checked) => 
                      setInstallOptions(prev => ({ ...prev, includeGoals: checked as boolean }))
                    }
                  />
                  <Label htmlFor="goals">Goals and milestones</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="habits"
                    checked={installOptions.includeHabits}
                    onCheckedChange={(checked) => 
                      setInstallOptions(prev => ({ ...prev, includeHabits: checked as boolean }))
                    }
                  />
                  <Label htmlFor="habits">Daily habits</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="settings"
                    checked={installOptions.includeSettings}
                    onCheckedChange={(checked) => 
                      setInstallOptions(prev => ({ ...prev, includeSettings: checked as boolean }))
                    }
                  />
                  <Label htmlFor="settings">Settings and preferences</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInstallTemplate}
                disabled={!installOptions.workspaceName || 
                  !(installOptions.includeWorkspaces || installOptions.includeBlocks || 
                    installOptions.includeGoals || installOptions.includeHabits)}
              >
                <Download className="h-4 w-4 mr-2" />
                Install Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}