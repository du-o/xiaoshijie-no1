"use client";

import { useOpenClawNews } from "@/hooks/use-news";
import { Loader2, ExternalLink, Github, Download } from "lucide-react";
import { formatTime } from "@/lib/utils/format";

export function OpenClawNewsSection() {
  const { data: releases, isLoading, error } = useOpenClawNews();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 card">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 card border-red-500/30 text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {releases?.slice(0, 3).map((release) => (
        <a
          key={release.id}
          href={release.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block card card-hover p-4 group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Github className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{release.tagName}</span>
              </div>
              <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">
                {release.name}
              </h4>
              <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                {release.body.replace(/[#*`]/g, "")}
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span>@{release.author}</span>
                <span>•</span>
                <span>{formatTime(release.publishedAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400 shrink-0">
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span>{release.downloadCount.toLocaleString()}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
