import MapEditor from "./mapEditor";

export default function Page() {
  return (
    <main className="fixed top-0 left-0 -z-10 h-screen w-screen border-[5px] border-blue-500 overflow-hidden">
      <MapEditor />
    </main>
  );
}
