import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Coffee, UtensilsCrossed, Cake } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStatus {
  businessSetup: boolean;
  categoriesCreated: boolean;
  menuItemsAdded: boolean;
  tablesConfigured: boolean;
  inventorySetup: boolean;
  firstOrderPlaced: boolean;
  isComplete: boolean;
  progress: number;
  nextStep: string;
  user: {
    name: string;
    role: string;
  };
}

interface CafeTemplate {
  id: string;
  name: string;
  description: string;
  features: string[];
  icon: string;
}

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [businessData, setBusinessData] = useState({
    businessName: '',
    address: '',
    phone: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: onboardingStatus, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status'],
    queryFn: () => fetch('/api/onboarding/status').then(res => res.json())
  });

  const { data: templates } = useQuery<CafeTemplate[]>({
    queryKey: ['onboarding-templates'],
    queryFn: () => fetch('/api/onboarding/templates').then(res => res.json())
  });

  const completeStepMutation = useMutation({
    mutationFn: async (data: { step: string; data: any }) => {
      const response = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to complete step');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      toast({
        title: "Step completed!",
        description: "Moving to the next step...",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete step. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleBusinessSetup = async () => {
    if (!businessData.businessName.trim()) {
      toast({
        title: "Business name required",
        description: "Please enter your business name to continue.",
        variant: "destructive"
      });
      return;
    }

    await completeStepMutation.mutateAsync({
      step: 'business-setup',
      data: businessData
    });
    setCurrentStep(1);
  };

  const handleTemplateSelection = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Template required",
        description: "Please select a cafe type to continue.",
        variant: "destructive"
      });
      return;
    }

    await completeStepMutation.mutateAsync({
      step: 'quick-setup',
      data: { cafeType: selectedTemplate }
    });
    setCurrentStep(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your setup progress...</p>
        </div>
      </div>
    );
  }

  if (onboardingStatus?.isComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Welcome to your POS System!</CardTitle>
            <CardDescription>
              Your cafe is all set up and ready to serve customers. Great job, {onboardingStatus.user.name}!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              You can now start taking orders, managing inventory, and growing your business.
            </p>
            <Button onClick={() => window.location.href = '/pos'} size="lg">
              Start Taking Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your POS System!</h1>
        <p className="text-muted-foreground mb-4">
          Let's get your cafe set up in just a few minutes, {onboardingStatus?.user.name}
        </p>
        <Progress value={onboardingStatus?.progress || 0} className="mb-2" />
        <p className="text-sm text-muted-foreground">
          {onboardingStatus?.progress || 0}% complete
        </p>
      </div>

      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your business</CardTitle>
            <CardDescription>
              We'll customize your POS system based on your cafe's details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={businessData.businessName}
                onChange={(e) => setBusinessData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Enter your cafe name"
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={businessData.address}
                onChange={(e) => setBusinessData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Your cafe's address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={businessData.phone}
                onChange={(e) => setBusinessData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Contact number"
              />
            </div>
            <Button 
              onClick={handleBusinessSetup} 
              className="w-full"
              disabled={completeStepMutation.isPending}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose your cafe type</CardTitle>
            <CardDescription>
              We'll set up your menu, categories, and inventory based on your selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {templates?.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{template.icon}</div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {template.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button 
              onClick={handleTemplateSelection} 
              className="w-full"
              disabled={!selectedTemplate || completeStepMutation.isPending}
            >
              Set Up My {templates?.find(t => t.id === selectedTemplate)?.name || 'Cafe'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Setup Complete!</CardTitle>
            <CardDescription>
              Your {templates?.find(t => t.id === selectedTemplate)?.name} is ready to go
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We've created sample categories, menu items, and inventory based on your cafe type.
              You can customize everything in the management sections.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => window.location.href = '/menu'}>
                Customize Menu
              </Button>
              <Button onClick={() => window.location.href = '/pos'}>
                Start Taking Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}