import { Typography } from "crystra-ui-core";
import { HostTaskWorkbench } from "../../../../../../wsr-dsh/src/client/task-workbench/host-task-workbench";
import { useTasks } from "../tasks/use-tasks";
import { TasksFeedback } from "../tasks/task-views";
/** Dev transport adapter; business view and state live in Crystra-dsh. */
export function ConnectedTaskWorkbench({
  taskId,
  navigationContainer,
}: {
  taskId: string;
  navigationContainer?: HTMLElement | null;
}) {
  const tasks = useTasks();
  const task = tasks.items.find((item) => item.id === taskId);
  return (
    <HostTaskWorkbench
      taskId={taskId}
      navigationContainer={navigationContainer}
      status={
        tasks.phase !== "ready" ? (
          <TasksFeedback state={tasks} />
        ) : !task ? (
          <Typography as="p" variant="description" role="status">
            当前任务不存在或不可读取。
          </Typography>
        ) : undefined
      }
    />
  );
}
