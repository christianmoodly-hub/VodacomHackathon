import { createContext, useContext } from "react";
import { useWorkspace } from "../hooks/useWorkspace";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const workspace = useWorkspace();
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) {
    throw new Error("useWorkspaceContext must be used inside WorkspaceProvider");
  }
  return workspace;
}
