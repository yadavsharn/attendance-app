import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScanFace, Shield, Clock, Users, ArrowRight, CheckCircle } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <ScanFace className="w-4 h-4" />
              AI-Powered Face Recognition
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Smart Attendance for Modern Workplaces
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Eliminate manual attendance tracking with our secure, AI-powered face recognition system. 
              Fast, accurate, and enterprise-ready.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need for Attendance Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for enterprises that demand security, reliability, and ease of use.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ScanFace, title: 'Face Recognition', desc: 'AI-powered face detection with 99% accuracy' },
              { icon: Shield, title: 'Secure & Private', desc: 'Enterprise-grade security with role-based access' },
              { icon: Clock, title: 'Real-time Tracking', desc: 'Instant attendance marking and monitoring' },
              { icon: Users, title: 'Team Management', desc: 'Manage employees, departments, and reports' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Modernize Your Attendance?</h2>
          <p className="text-lg text-muted-foreground mb-8">Start using FaceTrack today.</p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 h-14">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 FaceTrack. Face Recognition Attendance System.</p>
        </div>
      </footer>
    </div>
  );
}
