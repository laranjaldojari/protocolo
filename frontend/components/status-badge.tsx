import { Badge } from '@/components/ui/badge';
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={STATUS_COLOR[status] ?? ''}>{STATUS_LABEL[status] ?? status}</Badge>;
}
