import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={clsx('min-w-full', className)}
          style={{ borderCollapse: 'collapse' }}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, style, ...props }, ref) => {
  return (
    <thead 
      ref={ref} 
      className={clsx(className)} 
      style={{
        backgroundColor: 'var(--ibacs-primary)',
        borderBottom: '2px solid var(--ibacs-tertiary)',
        ...style,
      }}
      {...props}
    >
      {children}
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, style, ...props }, ref) => {
  return (
    <tbody
      ref={ref}
      className={clsx(className)}
      style={{
        backgroundColor: 'var(--ibacs-secondary)',
        ...style,
      }}
      {...props}
    >
      {children}
    </tbody>
  );
});

TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, children, style, ...props }, ref) => {
  return (
    <tr 
      ref={ref} 
      className={clsx('transition-all duration-150', className)} 
      style={{
        ...style,
      }}
      {...props}
    >
      {children}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<
  HTMLTableCellElement,
  HTMLAttributes<HTMLTableCellElement>
>(({ className, children, style, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={clsx(
        'px-6 py-4 text-left text-xs font-bold uppercase tracking-wider',
        className
      )}
      style={{
        color: 'var(--text-secondary)',
        ...style,
      }}
      {...props}
    >
      {children}
    </th>
  );
});

TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<
  HTMLTableCellElement,
  HTMLAttributes<HTMLTableCellElement>
>(({ className, children, style, ...props }, ref) => {
  return (
    <td
      ref={ref}
      className={clsx('px-6 py-4 text-sm', className)}
      style={{
        color: 'var(--text-primary)',
        ...style,
      }}
      {...props}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';