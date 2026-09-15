import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BiSurface, CrystraShell, type CrystraPage } from "../public";
function Scenario() {
  const [route, setRoute] = useState<CrystraPage>("tasks");
  return (
    <BiSurface data-crystra-theme="dark" className="product-test-surface">
      <CrystraShell
        route={route}
        tasks={[
          { id: "task-a", title: "Alpha task" },
          { id: "task-b", title: "Beta task" },
        ]}
        workflows={[
          { id: "workflow-a", title: "Alpha workflow", revision: "r1" },
        ]}
        onNavigate={setRoute}
        onOpenHarness={() => {}}
        onNewTask={() => setRoute("new-task")}
        onOpenSettings={() => {}}
      >
        <input aria-label="preserved context" defaultValue="unsent" />
      </CrystraShell>
    </BiSurface>
  );
}
const style = document.createElement("style");
style.textContent = "body{margin:0}.product-test-surface{height:100vh}";
document.head.append(style);
createRoot(document.getElementById("root")!).render(<Scenario />);
