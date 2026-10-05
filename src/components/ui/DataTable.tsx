"use client";

import { Children, isValidElement, type ReactNode } from "react";
import {
  Table,
  TableCard,
} from "@/components/untitled/application/table/table";

type NodeProps = { children?: ReactNode; "data-row-id"?: string };
function elements(children: ReactNode) {
  return Children.toArray(children).filter(isValidElement<NodeProps>);
}
function text(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      isValidElement<NodeProps>(child)
        ? text(child.props.children)
        : String(child ?? ""),
    )
    .join("");
}
/** Hòe adapter: server-rendered row content, official Table geometry and keyboard semantics. */
export function DataTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const sections = elements(children);
  const headers = elements(
    elements(sections.find((node) => node.type === "thead")?.props.children)[0]
      ?.props.children,
  );
  const rows = elements(
    sections.find((node) => node.type === "tbody")?.props.children,
  );
  const caption = sections.find((node) => node.type === "caption")?.props
    .children;
  return (
    <TableCard.Root size="md" className={className}>
      <Table aria-label={caption ? text(caption) : "Danh sách quản trị"}>
        <Table.Header>
          {headers.map((header, index) => (
            <Table.Head
              key={index}
              id={`column-${index}`}
              isRowHeader={index === 0}
              label={text(header.props.children)}
            />
          ))}
        </Table.Header>
        <Table.Body
          renderEmptyState={() => (
            <div className="p-6 text-sm text-tertiary">
              Chưa có bản ghi phù hợp.
            </div>
          )}
        >
          {rows.map((row, index) => (
            <Table.Row
              key={row.props["data-row-id"] ?? index}
              id={String(row.props["data-row-id"] ?? index)}
            >
              {elements(row.props.children).map((cell, column) => (
                <Table.Cell key={column}>{cell.props.children}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </TableCard.Root>
  );
}
