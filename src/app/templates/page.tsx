'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Heart,
  Copy,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Layout,
  Calendar,
  Target,
  Brain,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Code,
  Palette,
  Music,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Template categories with icons
const categories = [
  { id: 'all', name: 'All Templates', icon: Layout },
  { id: 'productivity', name: 'Productivity', icon: Target },
  { id: 'business', name: 'Business', icon: Briefcase },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'health', name: 'Health & Fitness', icon: Dumbbell },
  { id: 'creative', name: 'Creative', icon: Palette },
  { id: 'development', name: 'Development', icon: Code },
  { id: 'personal', name: 'Personal', icon: Heart }
];

// Mock template data
const templates = [
  {
    id: '1',
    name: 'GTD System',
    description: 'Complete Getting Things Done workflow with contexts, projects, and reviews',
    category: 'productivity',
    author: 'David Allen',
    authorAvatar: '/avatars/david.jpg',
    rating: 4.9,
    downloads: 15420,
    likes: 3842,
    preview: '/templates/gtd-preview.png',
    tags: ['productivity', 'workflow', 'tasks'],
    isPro: false,
    isFeatured: true
  },
  {
    id: '2',
    name: 'PARA Method',
    description: 'Projects, Areas, Resources, Archives - Tiago Forte\'s organization method',
    category: 'productivity',
    author: 'Tiago Forte',
    authorAvatar: '/avatars/tiago.jpg',
    rating: 4.8,
    downloads: 12350,
    likes: 2891,
    preview: '/templates/para-preview.png',
    tags: ['organization', 'knowledge', 'notes'],
    isPro: true,
    isFeatured: true
  },
  {
    id: '3',
    name: 'Startup Sprint',
    description: 'Weekly sprint planning for startups with OKRs and metrics tracking',
    category: 'business',
    author: 'Sarah Chen',
    authorAvatar: '/avatars/sarah.jpg',
    rating: 4.7,
    downloads: 8921,
    likes: 1876,
    preview: '/templates/sprint-preview.png',
    tags: ['startup', 'agile', 'planning'],
    isPro: true,
    isFeatured: false
  },
  {
    id: '4',
    name: 'Academic Planner',
    description: 'Semester planning with course tracking, assignments, and study schedules',
    category: 'education',
    author: 'Prof. Johnson',
    authorAvatar: '/avatars/prof.jpg',
    rating: 4.9,
    downloads: 21843,
    likes: 5412,
    preview: '/templates/academic-preview.png',
    tags: ['study', 'university', 'education'],
    isPro: false,
    isFeatured: true
  },
  {
    id: '5',
    name: 'Fitness Journey',
    description: 'Complete workout planning with progress tracking and meal planning',
    category: 'health',
    author: 'Mike Trainer',
    authorAvatar: '/avatars/mike.jpg',
    rating: 4.6,
    downloads: 7632,
    likes: 1523,
    preview: '/templates/fitness-preview.png',
    tags: ['fitness', 'health', 'workout'],
    isPro: false,
    isFeatured: false
  },
  {
    id: '6',
    name: 'Content Calendar',
    description: 'Social media and blog content planning with publishing schedule',
    category: 'creative',
    author: 'Emily Writer',
    authorAvatar: '/avatars/emily.jpg',
    rating: 4.8,
    downloads: 11234,
    likes: 2876,
    preview: '/templates/content-preview.png',
    tags: ['content', 'social media', 'marketing'],
    isPro: true,
    isFeatured: false
  }
];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [likedTemplates, setLikedTemplates] = useState<string[]>([]);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'recent':
        return 0; // Would use creation date
      default:
        return 0;
    }
  });

  const handleLike = (templateId: string) => {
    setLikedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">Template Marketplace</h1>
              <p className="text-muted-foreground mt-1">
                Discover and use pre-built planning systems from the community
              </p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Categories */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8">
              <h3 className="font-semibold mb-4">Categories</h3>
              <nav className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="browse" className="space-y-6">
              <TabsList>
                <TabsTrigger value="browse">Browse</TabsTrigger>
                <TabsTrigger value="featured">Featured</TabsTrigger>
                <TabsTrigger value="my-templates">My Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-6">
                {/* Featured Banner */}
                {selectedCategory === 'all' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20 p-8"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-primary">NEW RELEASE</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">2024 Productivity Bundle</h2>
                      <p className="text-muted-foreground mb-4 max-w-md">
                        Get 10 premium templates for the price of 3. Limited time offer!
                      </p>
                      <Button>
                        Explore Bundle
                      </Button>
                    </div>
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
                  </motion.div>
                )}

                {/* Template Grid */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {sortedTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Preview Image */}
                        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Layout className="h-12 w-12 text-primary/50" />
                          </div>
                          {template.isFeatured && (
                            <Badge className="absolute top-2 right-2 gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                          {template.isPro && (
                            <Badge variant="secondary" className="absolute top-2 left-2">
                              PRO
                            </Badge>
                          )}
                        </div>

                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">
                                {template.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Author */}
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{template.author[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              by {template.author}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              {template.rating}
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {template.downloads.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className={`h-3 w-3 ${
                                likedTemplates.includes(template.id) ? 'fill-red-500 text-red-500' : ''
                              }`} />
                              {template.likes.toLocaleString()}
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button className="flex-1" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleLike(template.id)}>
                              <Heart className={`h-3 w-3 ${
                                likedTemplates.includes(template.id) ? 'fill-current' : ''
                              }`} />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="featured">
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Featured Templates</h3>
                  <p className="text-muted-foreground">
                    Hand-picked templates recommended by our team
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="my-templates">
                <div className="text-center py-12">
                  <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your Templates</h3>
                  <p className="text-muted-foreground mb-4">
                    Templates you've created or saved
                  </p>
                  <Button>
                    Create New Template
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}