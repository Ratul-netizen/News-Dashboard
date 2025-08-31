"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Eye, Calendar, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { TrendingPost } from "@/lib/types"
import dayjs from "dayjs"
import { PostAnalysisModal } from "@/components/post-analysis-modal"

interface TrendingPostsTableProps {
  posts: TrendingPost[]
  title?: string
}

export function TrendingPostsTable({ posts, title = "Top 10 Viral Posts" }: TrendingPostsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "trendingScore", desc: true }])
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  const handleViewAnalysis = (postId: string) => {
    setSelectedPostId(postId)
    setAnalysisModalOpen(true)
  }

  // Width and alignment classes per column id
  const getColClass = (columnId: string, isHeader: boolean = false): string => {
    switch (columnId) {
      case "postDate":
        return "w-[140px]"
      case "postText":
        return "w-[300px] overflow-hidden"
      case "category":
        return "w-[100px]"
      case "sentiment":
        return "w-[120px]"
      case "source":
        return "w-[135px] overflow-hidden"
      case "reactions":
        return `w-[125px] ${isHeader ? "text-right" : "text-right"} whitespace-nowrap tabular-nums`
      case "shares":
        return `w-[90px] ${isHeader ? "text-right" : "text-right"} whitespace-nowrap tabular-nums`
      case "comments":
        return `w-[115px] ${isHeader ? "text-right" : "text-right"} whitespace-nowrap tabular-nums`
      case "sourceCount":
        return `w-[100px] ${isHeader ? "text-center" : "text-center"} whitespace-nowrap`
      case "trendingScore":
        return `w-[160px] ${isHeader ? "text-right" : "text-right"} whitespace-nowrap tabular-nums`
      case "actions":
        return "w-[96px] text-center"
      default:
        return ""
    }
  }

  const columns: ColumnDef<TrendingPost>[] = [
    {
      accessorKey: "postDate",
      header: ({ column }) => (
        <div className="w-[140px]">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold text-gray-300 hover:text-white"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Post Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-300 py-2 w-[140px]">
          <div className="font-medium">{dayjs(row.getValue("postDate")).format("MMM DD, YYYY")}</div>
          <div className="text-xs text-gray-500 mt-1">{dayjs(row.getValue("postDate")).format("HH:mm")}</div>
        </div>
      ),
    },
    {
      accessorKey: "postText",
      header: () => <div className="w-[300px] overflow-hidden">Post Text</div>,
      cell: ({ row }) => {
        const text = row.getValue("postText") as string
        // Wider column with two-line clamp to avoid overlapping but keep height small
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="w-[300px] text-sm text-gray-300 cursor-help py-2 leading-6 overflow-hidden break-words"
                  title={text}
                >
                  <span className="line-clamp-2 block">{text}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xl bg-gray-800 border-gray-700 text-white">
                <p className="whitespace-pre-wrap text-sm">{text}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string | null
        return category ? (
          <Badge variant="secondary" className="bg-blue-900 text-blue-100 px-3 py-2">
            {category}
          </Badge>
        ) : (
          <span className="text-gray-500 text-sm py-2">Uncategorized</span>
        )
      },
    },
    {
      accessorKey: "sentiment",
      header: "Sentiment",
      cell: ({ row }) => {
        const sentiment = row.getValue("sentiment") as string
        const sentimentColors = {
          positive: "bg-green-900 text-green-100 border-green-700",
          negative: "bg-red-900 text-red-100 border-red-700",
          neutral: "bg-gray-900 text-gray-100 border-gray-700"
        }
        return (
          <Badge 
            variant="outline" 
            className={`px-3 py-2 ${sentimentColors[sentiment as keyof typeof sentimentColors] || sentimentColors.neutral}`}
          >
            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <div className="text-sm text-gray-300 max-w-[150px] truncate py-2" title={row.getValue("source")}>
          {row.getValue("source")}
        </div>
      ),
    },
    {
      accessorKey: "reactions",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-red-400 hover:text-red-300"
        >
          Reactions
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-red-400 font-semibold py-2">{row.getValue<number>("reactions").toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "shares",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-green-400 hover:text-green-300"
        >
          Shares
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-green-400 font-semibold py-2">{row.getValue<number>("shares").toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "comments",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-blue-400 hover:text-blue-300"
        >
          Comments
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-blue-400 font-semibold py-2">{row.getValue<number>("comments").toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "sourceCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-300 hover:text-white"
        >
          <Hash className="mr-1 h-4 w-4" />
          Sources
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center py-2">
          <Badge variant="outline" className="border-gray-600 text-gray-300 px-3 py-2">
            {row.getValue("sourceCount")}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "trendingScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-yellow-400 hover:text-yellow-300"
        >
          Virality Score
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-yellow-400 font-semibold py-2">{row.getValue<number>("trendingScore").toFixed(1)}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const post = row.original
        return (
                  <div className="flex items-center gap-2 py-2">
          {post.postLink && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <a href={post.postLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                  <p>View original post</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => handleViewAnalysis(post.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                <p>View post analysis</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ArrowUpDown className="h-5 w-5 text-blue-500" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table */}
            <div className="rounded-md border border-gray-800 overflow-x-auto">
              <Table className="w-full table-fixed min-w-[1260px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-gray-800 hover:bg-gray-800/50">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className={`text-gray-300 font-semibold px-4 py-4 ${getColClass(header.column.id, true)}`}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="border-gray-800 hover:bg-gray-800/30"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={`text-gray-300 px-4 py-4 ${getColClass(cell.column.id)}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                        No trending posts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}{" "}
                of {table.getFilteredRowModel().rows.length} posts
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: table.getPageCount() }, (_, i) => (
                    <Button
                      key={i}
                      variant={table.getState().pagination.pageIndex === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => table.setPageIndex(i)}
                      className={
                        table.getState().pagination.pageIndex === i
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                      }
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PostAnalysisModal component */}
      <PostAnalysisModal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        postId={selectedPostId}
      />
    </>
  )
}
