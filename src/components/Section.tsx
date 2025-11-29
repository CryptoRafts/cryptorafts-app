"use client";
export function Section({ title, subtitle, right, children }:{
  title: string; subtitle?: string; right?: React.ReactNode; children?: React.ReactNode;
}){
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
export function Card({ children, className="" }:{ children: React.ReactNode; className?: string }){
  return <div className={"glass rounded-2xl p-5 border border-white/10 "+className}>{children}</div>;
}
