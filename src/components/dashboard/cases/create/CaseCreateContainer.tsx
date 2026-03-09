"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CaseBasicInfoForm from "./CaseBasicInfoForm";
import CaseClientForm from "./CaseClientForm";
import CaseHearingCreateForm from "./CaseHearingCreateForm";

type TabValue = "basic" | "client" | "hearing";

function CaseCreateContainer() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<TabValue>("basic");

  // Clear any previous draft case ID when starting a new case creation flow
  useState(() => {
    localStorage.removeItem("current_case_id");
    return 1;
  });

  const handleStepComplete = () => {
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Move to next tab
      const tabMap: Record<number, TabValue> = {
        1: "basic",
        2: "client",
        3: "hearing",
      };
      setActiveTab(tabMap[nextStep]);
    }
  };

  const handleTabChange = (value: string) => {
    const tabValue = value as TabValue;
    const stepMap: Record<TabValue, number> = {
      basic: 1,
      client: 2,
      hearing: 3,
    };
    
    const targetStep = stepMap[tabValue];
    
    // Only allow switching to tabs that are <= currentStep
    if (targetStep <= currentStep) {
      setActiveTab(tabValue);
    }
  };

  const isStepActive = (step: number) => {
    const tabMap: Record<number, TabValue> = {
      1: "basic",
      2: "client",
      3: "hearing",
    };
    return activeTab === tabMap[step];
  };

  return (
    <div>
      <div className="w-full flex flex-col items-center">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-full lg:max-w-[1000px] xl:max-w-[1200px] 2xl:max-w-[1400px]">
          <TabsList className="w-full min-w-[500px] max-w-full lg:max-w-[1000px] xl:max-w-[1200px] 2xl:max-w-[1400px] h-11 bg-white rounded-xl shadow-sm border border-gray-200 p-1 gap-1 mb-6 inline-flex">
            <TabsTrigger 
              value="basic"
              disabled={currentStep < 1}
              className="h-9 flex-1 px-4 rounded-lg font-medium text-sm transition-all bg-transparent text-gray-700 hover:bg-gray-50 data-[state=active]:bg-primary-green data-[state=active]:text-gray-900 data-[state=active]:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Basic Info
            </TabsTrigger>
            <TabsTrigger 
              value="client"
              disabled={currentStep < 2}
              className="h-9 flex-1 px-4 rounded-lg font-medium text-sm transition-all bg-transparent text-gray-700 hover:bg-gray-50 data-[state=active]:bg-primary-green data-[state=active]:text-gray-900 data-[state=active]:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Client
            </TabsTrigger>
            <TabsTrigger 
              value="hearing"
              disabled={currentStep < 3}
              className="h-9 flex-1 px-4 rounded-lg font-medium text-sm transition-all bg-transparent text-gray-700 hover:bg-gray-50 data-[state=active]:bg-primary-green data-[state=active]:text-gray-900 data-[state=active]:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hearing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-0 bg-white p-5 lg:p-8 shadow-sm rounded-xl min-w-[500px] w-full max-w-full lg:max-w-[1000px] xl:max-w-[1200px] 2xl:max-w-[1400px]">
            <div className="rounded-xl">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Case Primary Information</h2>
                <p className="text-sm text-gray-500 mt-1">Enter the case primary information for Initial Setup</p>
              </div>
              <CaseBasicInfoForm 
                isActive={isStepActive(1)}
                onStepComplete={handleStepComplete}
              />
            </div>
          </TabsContent>

          <TabsContent value="client" className="mt-0 bg-white p-5 lg:p-8 shadow-sm rounded-xl min-w-[500px] w-full max-w-full lg:max-w-[1000px] xl:max-w-[1200px] 2xl:max-w-[1400px]">
            <div className="rounded-xl">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
                <p className="text-sm text-gray-500 mt-1">Enter the client details and billing information</p>
              </div>
              <CaseClientForm 
                isActive={isStepActive(2)}
                onStepComplete={handleStepComplete}
              />
            </div>
          </TabsContent>

          <TabsContent value="hearing" className="mt-0 bg-white p-5 lg:p-8 shadow-sm rounded-xl min-w-[500px] w-full max-w-full lg:max-w-[1000px] xl:max-w-[1200px] 2xl:max-w-[1400px]">
            <div className="rounded-xl">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Hearing Information</h2>
                <p className="text-sm text-gray-500 mt-1">Add hearing details for this case</p>
              </div>
              <CaseHearingCreateForm 
                isActive={isStepActive(3)}
                onStepComplete={handleStepComplete}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default CaseCreateContainer;
