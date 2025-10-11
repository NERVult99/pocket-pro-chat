
// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { toast } from "sonner";
// import { 
//   Wallet, 
//   TrendingUp, 
//   DollarSign, 
//   Sparkles, 
//   AlertCircle,
//   ArrowLeft,
//   Users,
//   Home
// } from "lucide-react";

// interface UserProfile {
//   hasDebts: boolean;
//   hasSavingsGoal: boolean;
//   dependents: number;
//   livingArrangement: 'rent' | 'own' | 'family';
// }

// interface BudgetAllocation {
//   amount: number;
//   percentage: number;
// }

// interface Allocations {
//   [category: string]: BudgetAllocation;
// }

// interface Recommendation {
//   type: 'success' | 'warning' | 'error';
//   message: string;
// }

// const BudgetSetup = () => {
//   const navigate = useNavigate();
//   const [userId, setUserId] = useState("");
//   const [salary, setSalary] = useState<string>('');
//   const [allocations, setAllocations] = useState<Allocations | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [userProfile, setUserProfile] = useState<UserProfile>({
//     hasDebts: false,
//     hasSavingsGoal: false,
//     dependents: 0,
//     livingArrangement: 'rent'
//   });

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     const { data: { session } } = await supabase.auth.getSession();
//     if (!session) {
//       navigate("/auth");
//       return;
//     }
//     setUserId(session.user.id);
//   };

//   // AI-powered budget allocation logic using the 50/30/20 rule with adjustments
//   const generateBudgetAllocation = (monthlySalary: number, profile: UserProfile): Allocations => {
//     const salary = parseFloat(String(monthlySalary));
    
//     // Base categories with recommended percentages
//     let categories: { [key: string]: number } = {
//       'Essentials': 0.50,
//       'Savings & Investments': 0.20,
//       'Lifestyle & Entertainment': 0.15,
//       'Food & Dining': 0.10,
//       'Healthcare': 0.05
//     };

//     // Adjust based on user profile
//     if (profile.hasDebts) {
//       categories['Debt Repayment'] = 0.15;
//       categories['Lifestyle & Entertainment'] = 0.10;
//       categories['Savings & Investments'] = 0.15;
//     }

//     if (profile.hasSavingsGoal) {
//       categories['Savings & Investments'] += 0.05;
//       categories['Lifestyle & Entertainment'] -= 0.05;
//     }

//     if (profile.dependents > 0) {
//       categories['Essentials'] += 0.05 * profile.dependents;
//       categories['Lifestyle & Entertainment'] -= 0.03 * profile.dependents;
//       categories['Education & Childcare'] = 0.08 * profile.dependents;
//     }

//     if (profile.livingArrangement === 'own') {
//       categories['Essentials'] -= 0.10;
//       categories['Savings & Investments'] += 0.05;
//       categories['Lifestyle & Entertainment'] += 0.05;
//     }

//     // Normalize percentages to ensure they sum to 1
//     const total = Object.values(categories).reduce((a, b) => a + b, 0);
//     Object.keys(categories).forEach(key => {
//       categories[key] = categories[key] / total;
//     });

//     // Calculate actual amounts
//     const allocatedBudgets: Allocations = {};
//     Object.keys(categories).forEach(category => {
//       allocatedBudgets[category] = {
//         amount: Math.round(salary * categories[category]),
//         percentage: Math.round(categories[category] * 100)
//       };
//     });

//     return allocatedBudgets;
//   };

//   const handleGenerateAllocation = async () => {
//     if (!salary || parseFloat(salary) <= 0) {
//       toast.error('Please enter a valid salary amount');
//       return;
//     }

//     setLoading(true);
    
//     // Simulate AI processing
//     setTimeout(async () => {
//       const budgetPlan = generateBudgetAllocation(parseFloat(salary), userProfile);
//       setAllocations(budgetPlan);
      
//       // Save to Supabase
//       await saveBudgetToSupabase(budgetPlan, parseFloat(salary));
      
//       setLoading(false);
//       toast.success("AI Budget Plan Generated Successfully!");
//     }, 1500);
//   };

//   const saveBudgetToSupabase = async (budgetPlan: Allocations, monthlySalary: number) => {
//     try {
//       const currentMonth = new Date().toISOString().slice(0, 7);

//       // Delete existing budgets for this month
//       await supabase
//         .from("budgets")
//         .delete()
//         .eq("user_id", userId)
//         .eq("month", currentMonth);

//       // Insert new budgets
//       const budgetData = Object.entries(budgetPlan).map(([category, data]) => ({
//         user_id: userId,
//         month: currentMonth,
//         category: category,
//         allocated_amount: data.amount,
//         spent_amount: 0,
//       }));

//       if (budgetData.length > 0) {
//         const { error } = await supabase.from("budgets").insert(budgetData);
//         if (error) throw error;
//       }

//       // Update user profile with monthly income
//       await supabase
//         .from("profiles")
//         .update({ monthly_income: monthlySalary })
//         .eq("id", userId);

//     } catch (error) {
//       console.error("Error saving budgets:", error);
//       toast.error("Failed to save budgets");
//     }
//   };

//   const getRecommendation = (): Recommendation | null => {
//     if (!allocations) return null;
    
//     const savings = allocations['Savings & Investments'];
//     const savingsPercent = savings ? savings.percentage : 0;
    
//     if (savingsPercent >= 20) {
//       return {
//         type: 'success',
//         message: 'Excellent! Your savings allocation is healthy. 🎉'
//       };
//     } else if (savingsPercent >= 15) {
//       return {
//         type: 'warning',
//         message: 'Good start! Try to increase savings to 20% for better financial health.'
//       };
//     } else {
//       return {
//         type: 'error',
//         message: 'Consider reducing discretionary spending to boost savings.'
//       };
//     }
//   };

//   const totalBudget = allocations 
//     ? Object.values(allocations).reduce((sum, b) => sum + b.amount, 0) 
//     : 0;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
//       {/* Animated Background */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
//         <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
//         <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
//       </div>

//       {/* Header */}
//       <header className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-10 shadow-sm">
//         <div className="container mx-auto px-4 py-4 flex items-center gap-3">
//           <Button 
//             variant="ghost" 
//             size="icon" 
//             onClick={() => navigate("/dashboard")}
//             className="hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300"
//           >
//             <ArrowLeft className="w-5 h-5" />
//           </Button>
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
//               <Sparkles className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                 AI Budget Allocator
//               </h1>
//               <p className="text-sm text-muted-foreground">Smart financial planning with AI</p>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
//         <Card className="shadow-2xl mb-8 border-0 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
//           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
//           <CardHeader className="relative">
//             <div className="flex items-center gap-3">
//               <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
//                 <Wallet className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <CardTitle className="text-2xl">Budget Configuration</CardTitle>
//                 <CardDescription>Tell us about your financial situation</CardDescription>
//               </div>
//             </div>
//           </CardHeader>
          
//           <CardContent className="relative space-y-6">
//             {/* Monthly Salary */}
//             <div>
//               <Label className="flex items-center gap-2 text-base font-semibold mb-2">
//                 <DollarSign className="w-4 h-4" />
//                 Monthly Salary (₹)
//               </Label>
//               <Input
//                 type="number"
//                 value={salary}
//                 onChange={(e) => setSalary(e.target.value)}
//                 placeholder="Enter your monthly salary"
//                 className="text-2xl font-bold h-14 bg-white/50 dark:bg-gray-800/50 border-2 focus:border-indigo-500"
//               />
//             </div>

//             {/* User Profile Inputs */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Debts */}
//               <div>
//                 <Label className="text-sm font-semibold mb-2 block">
//                   Do you have debts?
//                 </Label>
//                 <Select
//                   value={userProfile.hasDebts.toString()}
//                   onValueChange={(value) => setUserProfile({...userProfile, hasDebts: value === 'true'})}
//                 >
//                   <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-2">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="false">No</SelectItem>
//                     <SelectItem value="true">Yes</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Savings Goal */}
//               <div>
//                 <Label className="text-sm font-semibold mb-2 block">
//                   Do you have a savings goal?
//                 </Label>
//                 <Select
//                   value={userProfile.hasSavingsGoal.toString()}
//                   onValueChange={(value) => setUserProfile({...userProfile, hasSavingsGoal: value === 'true'})}
//                 >
//                   <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-2">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="false">No</SelectItem>
//                     <SelectItem value="true">Yes</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Dependents */}
//               <div>
//                 <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
//                   <Users className="w-4 h-4" />
//                   Number of Dependents
//                 </Label>
//                 <Input
//                   type="number"
//                   min="0"
//                   value={userProfile.dependents}
//                   onChange={(e) => setUserProfile({...userProfile, dependents: parseInt(e.target.value) || 0})}
//                   className="bg-white/50 dark:bg-gray-800/50 border-2 focus:border-indigo-500"
//                 />
//               </div>

//               {/* Living Arrangement */}
//               <div>
//                 <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
//                   <Home className="w-4 h-4" />
//                   Living Arrangement
//                 </Label>
//                 <Select
//                   value={userProfile.livingArrangement}
//                   onValueChange={(value: 'rent' | 'own' | 'family') => setUserProfile({...userProfile, livingArrangement: value})}
//                 >
//                   <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-2">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="rent">Renting</SelectItem>
//                     <SelectItem value="own">Own Home</SelectItem>
//                     <SelectItem value="family">Living with Family</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Generate Button */}
//             <Button
//               onClick={handleGenerateAllocation}
//               disabled={loading}
//               className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg"
//             >
//               {loading ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
//                   Analyzing with AI...
//                 </>
//               ) : (
//                 <>
//                   <Sparkles className="w-5 h-5 mr-2" />
//                   Generate AI Budget Plan
//                 </>
//               )}
//             </Button>
//           </CardContent>
//         </Card>

//         {/* Budget Allocation Results */}
//         {allocations && (
//           <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
//             <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
//             <CardHeader className="relative">
//               <div className="flex items-center gap-2">
//                 <TrendingUp className="w-6 h-6 text-green-600" />
//                 <CardTitle className="text-2xl">Your AI-Recommended Budget</CardTitle>
//               </div>
//               <CardDescription>Total Monthly Budget: ₹{totalBudget.toLocaleString()}</CardDescription>
//             </CardHeader>

//             <CardContent className="relative">
//               {/* Recommendation Alert */}
//               {getRecommendation() && (
//                 <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
//                   getRecommendation()!.type === 'success' ? 'bg-green-50 border border-green-200 dark:bg-green-950/30' :
//                   getRecommendation()!.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30' :
//                   'bg-red-50 border border-red-200 dark:bg-red-950/30'
//                 }`}>
//                   <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
//                     getRecommendation()!.type === 'success' ? 'text-green-600' :
//                     getRecommendation()!.type === 'warning' ? 'text-yellow-600' :
//                     'text-red-600'
//                   }`} />
//                   <p className={`text-sm font-medium ${
//                     getRecommendation()!.type === 'success' ? 'text-green-800 dark:text-green-300' :
//                     getRecommendation()!.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
//                     'text-red-800 dark:text-red-300'
//                   }`}>
//                     {getRecommendation()!.message}
//                   </p>
//                 </div>
//               )}

//               {/* Budget Categories */}
//               <div className="space-y-4">
//                 {Object.entries(allocations).map(([category, data]) => (
//                   <div key={category} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50">
//                     <div className="flex justify-between items-center mb-3">
//                       <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{category}</h3>
//                       <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                         ₹{data.amount.toLocaleString()}
//                       </span>
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
//                         <div
//                           className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
//                           style={{ width: `${data.percentage}%` }}
//                         />
//                       </div>
//                       <span className="text-sm font-bold text-gray-600 dark:text-gray-400 w-12 text-right">
//                         {data.percentage}%
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Tips */}
//               <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
//                 <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
//                   <strong>💡 AI Tip:</strong> This allocation is personalized based on your profile and follows proven financial principles like the 50/30/20 rule. 
//                   You can adjust individual categories based on your specific needs, but try to maintain the overall balance for optimal financial health.
//                 </p>
//               </div>

//               {/* Save Button */}
//               <Button
//                 onClick={() => navigate("/dashboard")}
//                 className="w-full mt-6 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-semibold"
//               >
//                 Save & Go to Dashboard
//               </Button>
//             </CardContent>
//           </Card>
//         )}
//       </div>

//       {/* Custom Animations */}
//       <style>{`
//         @keyframes blob {
//           0%, 100% {
//             transform: translate(0, 0) scale(1);
//           }
//           25% {
//             transform: translate(20px, -50px) scale(1.1);
//           }
//           50% {
//             transform: translate(-20px, 20px) scale(0.9);
//           }
//           75% {
//             transform: translate(50px, 50px) scale(1.05);
//           }
//         }
        
//         .animate-blob {
//           animation: blob 7s infinite;
//         }
        
//         .animation-delay-2000 {
//           animation-delay: 2s;
//         }
        
//         .animation-delay-4000 {
//           animation-delay: 4s;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default BudgetSetup;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  AlertCircle,
  ArrowLeft,
  Users,
  Home,
  CreditCard,
  HomeIcon
} from "lucide-react";

interface UserProfile {
  hasDebts: boolean;
  hasSavingsGoal: boolean;
  dependents: number;
  livingArrangement: 'rent' | 'own' | 'family';
  monthlyEMI: number;
  monthlyRent: number;
}

interface BudgetAllocation {
  amount: number;
  percentage: number;
}

interface Allocations {
  [category: string]: BudgetAllocation;
}

interface Recommendation {
  type: 'success' | 'warning' | 'error';
  message: string;
}

const BudgetSetup = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [salary, setSalary] = useState<string>('');
  const [allocations, setAllocations] = useState<Allocations | null>(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    hasDebts: false,
    hasSavingsGoal: false,
    dependents: 0,
    livingArrangement: 'rent',
    monthlyEMI: 0,
    monthlyRent: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);
    
    // Load existing salary from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("monthly_income")
      .eq("id", session.user.id)
      .single();
    
    if (profile?.monthly_income) {
      setSalary(profile.monthly_income.toString());
    }  };

  // AI-powered budget allocation logic with EMI and Rent adjustments
  const generateBudgetAllocation = (monthlySalary: number, profile: UserProfile): Allocations => {
    const salary = parseFloat(String(monthlySalary));
    
    // Calculate fixed obligations first
    const fixedObligations = profile.monthlyEMI + profile.monthlyRent;
    const availableIncome = salary - fixedObligations;
    
    if (availableIncome <= 0) {
      toast.error("Your EMI and Rent exceed your monthly salary!");
      throw new Error("Fixed obligations exceed income");
    }
    
    // Base categories with recommended percentages (applied to available income)
    let categories: { [key: string]: number } = {
      'Essentials': 0.50,
      'Savings & Investments': 0.20,
      'Lifestyle & Entertainment': 0.15,
      'Food & Dining': 0.10,
      'Healthcare': 0.05
    };

    // Add fixed obligations as separate categories
    if (profile.monthlyEMI > 0) {
      // EMI is calculated separately and added as fixed amount
      categories['Debt Repayment (EMI)'] = 0;
    }

    if (profile.monthlyRent > 0 && profile.livingArrangement === 'rent') {
      // Rent is calculated separately and added as fixed amount
      categories['Monthly Rent'] = 0;
    }

    // Adjust based on user profile
    if (profile.hasDebts && profile.monthlyEMI > 0) {
      // Already handled by EMI input
      categories['Lifestyle & Entertainment'] = 0.10;
      categories['Savings & Investments'] = 0.15;
    } else if (profile.hasDebts) {
      categories['Additional Debt Repayment'] = 0.10;
      categories['Lifestyle & Entertainment'] = 0.10;
      categories['Savings & Investments'] = 0.15;
    }

    if (profile.hasSavingsGoal) {
      categories['Savings & Investments'] += 0.05;
      if (categories['Lifestyle & Entertainment'] > 0.10) {
        categories['Lifestyle & Entertainment'] -= 0.05;
      }
    }

    if (profile.dependents > 0) {
      categories['Essentials'] += 0.05 * profile.dependents;
      if (categories['Lifestyle & Entertainment'] > 0.07) {
        categories['Lifestyle & Entertainment'] -= 0.03 * profile.dependents;
      }
      categories['Education & Childcare'] = 0.08 * profile.dependents;
    }

    if (profile.livingArrangement === 'own') {
      categories['Essentials'] -= 0.10;
      categories['Savings & Investments'] += 0.05;
      categories['Lifestyle & Entertainment'] += 0.05;
    } else if (profile.livingArrangement === 'family') {
      categories['Essentials'] -= 0.15;
      categories['Savings & Investments'] += 0.10;
      categories['Lifestyle & Entertainment'] += 0.05;
    }

    // Normalize percentages (excluding fixed obligations)
    const variableCategories = Object.keys(categories).filter(
      key => !key.includes('EMI') && !key.includes('Rent')
    );
    
    const total = variableCategories.reduce((sum, key) => sum + categories[key], 0);
    variableCategories.forEach(key => {
      categories[key] = categories[key] / total;
    });

    // Calculate actual amounts
    const allocatedBudgets: Allocations = {};
    
    // Add fixed obligations first
    if (profile.monthlyEMI > 0) {
      allocatedBudgets['Debt Repayment (EMI)'] = {
        amount: profile.monthlyEMI,
        percentage: Math.round((profile.monthlyEMI / salary) * 100)
      };
    }

    if (profile.monthlyRent > 0 && profile.livingArrangement === 'rent') {
      allocatedBudgets['Monthly Rent'] = {
        amount: profile.monthlyRent,
        percentage: Math.round((profile.monthlyRent / salary) * 100)
      };
    }

    // Add variable categories
    variableCategories.forEach(category => {
      allocatedBudgets[category] = {
        amount: Math.round(availableIncome * categories[category]),
        percentage: Math.round(categories[category] * 100)
      };
    });

    return allocatedBudgets;
  };

  const handleGenerateAllocation = async () => {
    if (!salary || parseFloat(salary) <= 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    // Validate EMI and Rent
    const totalFixedCosts = userProfile.monthlyEMI + userProfile.monthlyRent;
    if (totalFixedCosts >= parseFloat(salary)) {
      toast.error('Your EMI and Rent cannot exceed or equal your salary!');
      return;
    }

    setLoading(true);
    
    // Simulate AI processing
    setTimeout(async () => {
      try {
        const budgetPlan = generateBudgetAllocation(parseFloat(salary), userProfile);
        setAllocations(budgetPlan);
        
        // Save to Supabase
        await saveBudgetToSupabase(budgetPlan, parseFloat(salary));
        
        setLoading(false);
        toast.success("AI Budget Plan Generated Successfully!");
      } catch (error) {
        setLoading(false);
        toast.error("Failed to generate budget plan");
      }
    }, 1500);
  };

  const saveBudgetToSupabase = async (budgetPlan: Allocations, monthlySalary: number) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Delete existing budgets for this month
      await supabase
        .from("budgets")
        .delete()
        .eq("user_id", userId)
        .eq("month", currentMonth);

      // Insert new budgets
      const budgetData = Object.entries(budgetPlan).map(([category, data]) => ({
        user_id: userId,
        month: currentMonth,
        category: category,
        allocated_amount: data.amount,
        spent_amount: 0,
      }));

      if (budgetData.length > 0) {
        const { error } = await supabase.from("budgets").insert(budgetData);
        if (error) throw error;
      }

      // Update user profile with monthly income
      await supabase
        .from("profiles")
        .update({ monthly_income: monthlySalary })
        .eq("id", userId);

    } catch (error) {
      console.error("Error saving budgets:", error);
      toast.error("Failed to save budgets");
    }
  };

  const getRecommendation = (): Recommendation | null => {
    if (!allocations) return null;
    
    const savings = allocations['Savings & Investments'];
    const savingsPercent = savings ? savings.percentage : 0;
    
    const totalFixedCosts = userProfile.monthlyEMI + userProfile.monthlyRent;
    const fixedCostPercentage = (totalFixedCosts / parseFloat(salary)) * 100;
    
    if (fixedCostPercentage > 50) {
      return {
        type: 'error',
        message: `⚠️ Your fixed costs (EMI + Rent) are ${fixedCostPercentage.toFixed(1)}% of income. Ideally, keep them below 50%.`
      };
    }
    
    if (savingsPercent >= 20) {
      return {
        type: 'success',
        message: 'Excellent! Your savings allocation is healthy. 🎉'
      };
    } else if (savingsPercent >= 15) {
      return {
        type: 'warning',
        message: 'Good start! Try to increase savings to 20% for better financial health.'
      };
    } else {
      return {
        type: 'error',
        message: 'Consider reducing discretionary spending to boost savings.'
      };
    }
  };

  const totalBudget = allocations 
    ? Object.values(allocations).reduce((sum, b) => sum + b.amount, 0) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Budget Allocator
              </h1>
              <p className="text-sm text-muted-foreground">Smart financial planning with AI</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <Card className="shadow-2xl mb-8 border-0 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Budget Configuration</CardTitle>
                <CardDescription>Tell us about your financial situation</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-6">
            {/* Monthly Salary */}
            <div>
              <Label className="flex items-center gap-2 text-base font-semibold mb-2">
                <DollarSign className="w-4 h-4" />
                Monthly Salary (₹)
              </Label>
              <Input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Enter your monthly salary"
                className="text-2xl font-bold h-14 bg-white/50 dark:bg-gray-800/50 border-2 focus:border-indigo-500"
              />
            </div>

            {/* User Profile Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Debts */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Do you have debts/loans?
                </Label>
                <Select
                  value={userProfile.hasDebts.toString()}
                  onValueChange={(value) => setUserProfile({...userProfile, hasDebts: value === 'true', monthlyEMI: value === 'false' ? 0 : userProfile.monthlyEMI})}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monthly EMI - Only shown when hasDebts is true */}
              {userProfile.hasDebts && (
                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <CreditCard className="w-4 h-4 text-red-500" />
                    Monthly EMI/Loan Payment (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={userProfile.monthlyEMI}
                    onChange={(e) => setUserProfile({...userProfile, monthlyEMI: parseFloat(e.target.value) || 0})}
                    placeholder="Enter your monthly EMI amount"
                    className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 focus:border-red-500 font-semibold"
                  />
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    This will be deducted from your available budget
                  </p>
                </div>
              )}

              {/* Savings Goal */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Do you have a savings goal?
                </Label>
                <Select
                  value={userProfile.hasSavingsGoal.toString()}
                  onValueChange={(value) => setUserProfile({...userProfile, hasSavingsGoal: value === 'true'})}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dependents */}
              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Users className="w-4 h-4" />
                  Number of Dependents
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={userProfile.dependents}
                  onChange={(e) => setUserProfile({...userProfile, dependents: parseInt(e.target.value) || 0})}
                  className="bg-white/50 dark:bg-gray-800/50 border-2 focus:border-indigo-500"
                />
              </div>

              {/* Living Arrangement */}
              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Home className="w-4 h-4" />
                  Living Arrangement
                </Label>
                <Select
                  value={userProfile.livingArrangement}
                  onValueChange={(value: 'rent' | 'own' | 'family') => setUserProfile({...userProfile, livingArrangement: value, monthlyRent: value !== 'rent' ? 0 : userProfile.monthlyRent})}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Renting</SelectItem>
                    <SelectItem value="own">Own Home</SelectItem>
                    <SelectItem value="family">Living with Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monthly Rent - Only shown when living arrangement is 'rent' */}
              {userProfile.livingArrangement === 'rent' && (
                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <HomeIcon className="w-4 h-4 text-orange-500" />
                    Monthly Rent (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={userProfile.monthlyRent}
                    onChange={(e) => setUserProfile({...userProfile, monthlyRent: parseFloat(e.target.value) || 0})}
                    placeholder="Enter your monthly rent amount"
                    className="bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 focus:border-orange-500 font-semibold"
                  />
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    This will be a fixed expense in your budget
                  </p>
                </div>
              )}
            </div>

            {/* Fixed Costs Summary */}
            {(userProfile.monthlyEMI > 0 || userProfile.monthlyRent > 0) && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Fixed Monthly Obligations
                </h4>
                <div className="space-y-1 text-sm">
                  {userProfile.monthlyEMI > 0 && (
                    <p className="text-amber-700 dark:text-amber-400">
                      • Loan EMI: ₹{userProfile.monthlyEMI.toLocaleString()}
                    </p>
                  )}
                  {userProfile.monthlyRent > 0 && (
                    <p className="text-amber-700 dark:text-amber-400">
                      • Monthly Rent: ₹{userProfile.monthlyRent.toLocaleString()}
                    </p>
                  )}
                  <p className="font-bold text-amber-800 dark:text-amber-300 pt-1 border-t border-amber-300 dark:border-amber-700">
                    Total Fixed: ₹{(userProfile.monthlyEMI + userProfile.monthlyRent).toLocaleString()}
                    {salary && ` (${(((userProfile.monthlyEMI + userProfile.monthlyRent) / parseFloat(salary)) * 100).toFixed(1)}% of salary)`}
                  </p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateAllocation}
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Budget Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Budget Allocation Results */}
        {allocations && (
          <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <CardTitle className="text-2xl">Your AI-Recommended Budget</CardTitle>
              </div>
              <CardDescription>Total Monthly Budget: ₹{totalBudget.toLocaleString()}</CardDescription>
            </CardHeader>

            <CardContent className="relative">
              {/* Recommendation Alert */}
              {getRecommendation() && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                  getRecommendation()!.type === 'success' ? 'bg-green-50 border border-green-200 dark:bg-green-950/30' :
                  getRecommendation()!.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30' :
                  'bg-red-50 border border-red-200 dark:bg-red-950/30'
                }`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    getRecommendation()!.type === 'success' ? 'text-green-600' :
                    getRecommendation()!.type === 'warning' ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <p className={`text-sm font-medium ${
                    getRecommendation()!.type === 'success' ? 'text-green-800 dark:text-green-300' :
                    getRecommendation()!.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
                    'text-red-800 dark:text-red-300'
                  }`}>
                    {getRecommendation()!.message}
                  </p>
                </div>
              )}

              {/* Budget Categories */}
              <div className="space-y-4">
                {Object.entries(allocations).map(([category, data]) => {
                  const isFixed = category.includes('EMI') || category.includes('Rent');
                  return (
                    <div 
                      key={category} 
                      className={`border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50 ${
                        isFixed ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{category}</h3>
                          {isFixed && (
                            <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-medium">
                              Fixed
                            </span>
                          )}
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          ₹{data.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isFixed 
                                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            }`}
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400 w-12 text-right">
                          {data.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  <strong>💡 AI Tip:</strong> This allocation is personalized based on your profile and follows proven financial principles like the 50/30/20 rule. 
                  Your fixed obligations (EMI + Rent) are deducted first, and the remaining budget is allocated across other categories. 
                  Try to maintain the overall balance for optimal financial health.
                </p>
              </div>

              {/* Save Button */}
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full mt-6 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-semibold"
              >
                Save & Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default BudgetSetup;
