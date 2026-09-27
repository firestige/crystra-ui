import { useState } from "react";
import { Menu } from "./collection-components";
import { Icon } from "./icon";
import { Typography } from "./design-system";
import { ResourceDialog } from "./resource-dialog";
import "./discussion-topic-bar.css";
export interface DiscussionTopicBarProps {
  group: { id: string; title: string };
  groups: { id: string; title: string }[];
  topics: { id: string; title: string }[];
  selectedId: string;
  busy?: boolean;
  historical?: boolean;
  onSelect: (id: string) => void;
  onSelectGroup: (id: string) => void;
  onNew: () => void;
  onRename: (title: string) => Promise<void>;
}
/** Controlled discussion navigation: membership and Session operations belong to the host. */
export function DiscussionTopicBar({
  group,
  groups,
  topics,
  selectedId,
  busy = false,
  historical = false,
  onSelect,
  onSelectGroup,
  onNew,
  onRename,
}: DiscussionTopicBarProps) {
  const current = topics.find((t) => t.id === selectedId);
  const [renaming, setRenaming] = useState(false),
    [title, setTitle] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <header className="crystra-discussion-topics" aria-label="讨论主题">
        <div className="crystra-discussion-group" title={group.title}>
          {groups.length > 1 ? (
            <Menu
              label={group.title}
              align="start"
              disabled={busy}
              items={groups.map((g) => ({
                id: g.id,
                label: g.title,
                icon: g.id === group.id ? <Icon name="check" /> : undefined,
                onSelect: () => onSelectGroup(g.id),
              }))}
            />
          ) : (
            <Typography variant="meta" tone="muted">
              {group.title}
            </Typography>
          )}
        </div>
        <div className="crystra-discussion-selector" title={current?.title}>
          <Menu
            label={current?.title || "当前主题"}
            align="start"
            disabled={busy}
            items={[
              ...topics.map((topic) => ({
                id: topic.id,
                label: topic.title,
                icon:
                  topic.id === selectedId ? <Icon name="check" /> : undefined,
                onSelect: () => onSelect(topic.id),
              })),
              {
                id: "new-topic",
                label: "新主题",
                icon: <Icon name="plus" />,
                disabled: historical,
                onSelect: onNew,
              },
              {
                id: "rename-topic",
                label: "重命名当前主题",
                icon: <Icon name="pencil" />,
                onSelect: () => {
                  setTitle(current?.title || "");
                  setError("");
                  setRenaming(true);
                },
              },
            ]}
          />
        </div>
      </header>
      {historical && (
        <p className="crystra-discussion-notice">
          历史讨论 · 工作台与后续讨论仍以当前领域文件为准
        </p>
      )}
      {renaming && (
        <ResourceDialog
          title="重命名主题"
          busy={saving}
          submitDisabled={!title.trim()}
          onCancel={() => setRenaming(false)}
          onSubmit={async () => {
            setSaving(true);
            try {
              await onRename(title);
              setRenaming(false);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <label>
            主题名称
            <input
              aria-label="主题名称"
              value={title}
              maxLength={120}
              disabled={saving}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
        </ResourceDialog>
      )}
    </>
  );
}
