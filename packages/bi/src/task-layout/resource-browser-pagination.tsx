import { Button } from "../components/design-system";
import { SelectField } from "../components/state-components";
/** Local view pagination only. The caller owns the filtered collection. */
export function ResourceBrowserPagination({
  page,
  pages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <footer id="browser-pagination">
      <div className="browser-page-size">
        <SelectField
          appearance="inline"
          label="每页"
          aria-label="每页条数"
          value={pageSize}
          options={[12, 24, 48].map((value) => ({
            value: String(value),
            label: String(value),
          }))}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        />
        条
      </div>
      <span>
        第 {page} / {pages} 页
      </span>
      <Button disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        上一页
      </Button>
      <Button disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        下一页
      </Button>
    </footer>
  );
}
