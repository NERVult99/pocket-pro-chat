import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  MessageCircle,
  PieChart,
  Target
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: "Real-time Price Comparisons",
      description: "Find the best deals across groceries, restaurants, and more instantly"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Get personalized recommendations and smart spending predictions"
    },
    {
      icon: Shield,
      title: "Opportunity Cost Analysis",
      description: "See what your money could mean in real, tangible terms"
    },
    {
      icon: MessageCircle,
      title: "Conversational Interface",
      description: "Chat naturally with your AI financial advisor anytime"
    },
    {
      icon: PieChart,
      title: "Budget Tracking",
      description: "Monitor spending across categories with visual dashboards"
    },
    {
      icon: Target,
      title: "Savings Goals",
      description: "Set targets and get proactive alerts to stay on track"
    }
  ];

  const benefits = [
    "Save an average of ₹5,000+ per month",
    "Compare prices from 100+ vendors instantly",
    "Make informed decisions in seconds",
    "Never miss a good deal again"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-primary text-white">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center overflow-hidden">
                <img src="/mon.jpg" alt="Budget Buddy" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-bold">Budget Buddy</h1>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Save Smarter,<br />Spend Wiser
            </h2>

            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              Your AI-powered companion for proactive budgeting and intelligent spending decisions
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-lg h-14 px-8 shadow-elevated"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg h-14 px-8"
                onClick={() => navigate("/chat")}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Try Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-8 text-sm">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to take control of your finances
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card hover-lift">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Start saving in three simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: "1",
                title: "Create Your Account",
                description: "Sign up in seconds and set up your budget preferences"
              },
              {
                step: "2",
                title: "Chat with Budget Buddy",
                description: "Ask about prices, get recommendations, and track spending naturally"
              },
              {
                step: "3",
                title: "Save More Money",
                description: "Watch your savings grow with AI-powered insights and alerts"
              }
            ].map((item, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-lg text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Finances?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-white/90">
            Join thousands of smart savers who are making better financial decisions every day
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg h-14 px-10 shadow-elevated"
            onClick={() => navigate("/auth")}
          >
            Start Saving Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Budget Buddy. Your AI-Powered Financial Companion.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
