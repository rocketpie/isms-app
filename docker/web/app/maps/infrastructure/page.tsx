// //app/maps/infrastructure/page.tsx
// //Description: map of all systems, locations, connections 
"use client";
export default function InfrastructureMap() { return (<div />) }

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { motion } from "framer-motion";
// import { useAssets } from "@/app/_hooks/useAssets";
// import { useAssetLinks } from "@/app/_hooks/useAssetLinks";
// import { LoadingLine, EmptyState } from "@/app/assets/_components";

// export default function SystemOverviewPage() {
//   const { data: systems, isLoading: loadingSystems } = useAssets("systems");
//   const { data: locations } = useAssets("locations");
//   const { data: connections } = useAssetLinks("systems", "connections");

//   const [nodes, setNodes] = useState<{ id: string; x: number; y: number }[]>([]);

//   useEffect(() => {
//     if (systems) {
//       // simple initial layout grid
//       setNodes(
//         systems.map((s, i) => ({
//           id: s.id,
//           x: (i % 5) * 220,
//           y: Math.floor(i / 5) * 180,
//         }))
//       );
//     }
//   }, [systems]);

//   if (loadingSystems) return <LoadingLine />;
//   if (!systems?.length) return <EmptyState message="No systems found." />;

//   return (
//     <div className="p-4">
//       <h1 className="text-xl font-semibold mb-4">Infrastructure Map Canvas</h1>
//       <div className="relative w-full h-[80vh] border rounded-lg bg-muted/30 overflow-hidden">
//         {nodes.map((n) => {
//           const system = systems.find((s) => s.id === n.id);
//           return (
//             <motion.div
//               key={n.id}
//               className="absolute p-2 w-48 cursor-move"
//               drag
//               dragMomentum={false}
//               style={{ left: n.x, top: n.y }}
//             >
//               <Card className="p-3 shadow-md">
//                 <div className="font-medium">{system?.name}</div>
//                 <div className="text-xs text-muted-foreground">
//                   {system?.description}
//                 </div>
//               </Card>
//             </motion.div>
//           );
//         })}
//       </div>
//       <Button className="mt-4">Save Layout</Button>
//     </div>
//   );
// }
