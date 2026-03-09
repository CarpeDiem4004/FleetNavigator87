import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Column {
  header: string;
  accessor: string;
  cell?: (value: any, row: any) => React.ReactNode;
}

interface DashboardTableProps {
  title: string;
  description?: string;
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
}

export const DashboardTable: React.FC<DashboardTableProps> = ({
  title,
  description,
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum dado disponível',
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="h-10 w-full animate-pulse bg-gray-200 rounded"
              ></div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, i) => (
                    <TableHead key={i}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, i) => (
                    <TableRow key={i}>
                      {columns.map((column, j) => (
                        <TableCell key={j}>
                          {column.cell 
                            ? column.cell(row[column.accessor], row)
                            : row[column.accessor]
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardTable;