"use client";

import { useMemo, useState } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowDownUp, Search, SlidersHorizontal } from "lucide-react";
import { ProgressBar, StatusPill } from "@respongo/ui-web";
import type { LiveAcademyUser } from "@/lib/live-dashboard";

const column = createColumnHelper<LiveAcademyUser>();

export function PeopleTable({ users }: { users: LiveAcademyUser[] }) {
  const [query, setQuery] = useState("");
  const columns = useMemo(() => [
    column.accessor("name", { header: "Kullanıcı", cell: (info) => <span className="rv2-person-cell"><i className="rv2-avatar rv2-avatar--soft">{info.row.original.initials}</i><span><strong>{info.getValue()}</strong><small>{info.row.original.role}</small></span></span> }),
    column.accessor("team", { header: "Ekip" }),
    column.accessor("status", { header: "Durum", cell: (info) => <StatusPill tone={info.getValue() === "Aktif" ? "success" : info.getValue() === "Davet edildi" ? "warning" : "neutral"}>{info.getValue()}</StatusPill> }),
    column.accessor("completion", { header: "İlerleme", cell: (info) => <ProgressBar value={info.getValue()} label={`${info.row.original.name} ilerleme`} /> }),
    column.accessor("lastSeen", { header: "Son etkinlik" }),
  ], []);
  const table = useReactTable({ data: users, columns, state: { globalFilter: query }, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });

  return <div className="rv2-data-table">
    <div className="rv2-table-tools"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kullanıcı ara" /></label><button><SlidersHorizontal size={16} /> Filtreler <span>2</span></button></div>
    <div className="rv2-table-scroll"><table><thead>{table.getHeaderGroups().map(group => <tr key={group.id}>{group.headers.map(header => <th key={header.id}><button onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}<ArrowDownUp size={13} /></button></th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map(row => <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>
    <div className="rv2-table-footer"><span>{table.getFilteredRowModel().rows.length} kullanıcı gösteriliyor</span><div><button disabled>Önceki</button><button className="is-active">1</button><button>Sonraki</button></div></div>
  </div>;
}

