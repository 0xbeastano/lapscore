import React from 'react';

const SkeletonLine = ({ className = "" }) => (
  <div className={`bg-[#1a1a1a] animate-pulse rounded ${className}`} />
);

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080808]">
      <div className="fixed top-0 left-0 w-full h-[64px] bg-[#0a0a0a] border-b border-[#1a1a1a] z-50 flex items-center px-6">
        <SkeletonLine className="w-8 h-8 rounded-lg mr-4" />
        <SkeletonLine className="w-32 h-4" />
      </div>

      <div className="pt-[84px] pb-12 w-full flex-1">
        <div className="p-4 sm:p-6 lg:px-12 max-w-7xl mx-auto space-y-6">
          {/* Hero Score Preview */}
          <div className="bg-[#111] border border-[#222] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between">
            <div className="w-full md:w-[40%] space-y-3">
              <SkeletonLine className="h-8 w-64" />
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-12 w-full rounded-xl mt-4" />
            </div>
            <div className="mt-8 md:mt-0 relative w-44 h-44 rounded-full border-8 border-[#1a1a1a] flex items-center justify-center">
              <SkeletonLine className="w-16 h-10" />
            </div>
          </div>

          <div className="flex space-x-6 overflow-hidden">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="flex flex-col space-y-2 min-w-[120px]">
                 <SkeletonLine className="h-3 w-12" />
                 <SkeletonLine className="h-6 w-20" />
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-12">
            <div className="h-96 bg-[#111] rounded-2xl border border-[#222] p-8 space-y-4">
              <SkeletonLine className="h-6 w-32" />
              <SkeletonLine className="h-4 w-full" />
              <SkeletonLine className="h-32 w-full rounded-xl" />
              <SkeletonLine className="h-4 w-full" />
            </div>
            <div className="space-y-6 flex flex-col">
              <div className="h-44 bg-[#111] rounded-2xl border border-[#222] p-8 space-y-4">
                <SkeletonLine className="h-6 w-32" />
                <SkeletonLine className="h-20 w-full rounded-xl" />
              </div>
              <div className="h-44 bg-[#111] rounded-2xl border border-[#222] p-8 space-y-4">
                <SkeletonLine className="h-6 w-32" />
                <SkeletonLine className="h-20 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
