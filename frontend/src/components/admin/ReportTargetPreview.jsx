import React from 'react';
import { Avatar } from '../ui/Avatar';
import { AdminIdLink } from './AdminIdLink';

const CreatorBlock = ({ creator, label = 'Creator' }) => {
  if (!creator) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      <Avatar src={creator.avatar} alt={creator.fullName} size="sm" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{creator.fullName}</p>
        <p className="text-[10px] text-slate-500">{creator.handle || `@${creator.username}`}</p>
        <p className="text-[10px] text-slate-400">
          {label} ID: <AdminIdLink id={creator.id} type="user" />
        </p>
      </div>
    </div>
  );
};

export const ReportTargetPreview = ({ preview, targetType, targetId }) => {
  if (!preview && !targetId) {
    return <p className="text-xs text-slate-400 italic">Content unavailable or removed.</p>;
  }

  if (!preview) {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <p className="text-xs font-bold uppercase text-slate-500">Reported Content</p>
        <p className="text-xs capitalize mt-1">{targetType}</p>
        <p className="text-[10px] text-slate-400 mt-1">ID: <AdminIdLink id={targetId} type={targetType === 'user' ? 'user' : targetType} /></p>
      </div>
    );
  }

  if (preview.type === 'reel' || targetType === 'reel') {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <p className="text-xs font-bold uppercase text-slate-500">Reported Content — Reel</p>
        {(preview.thumbnailUrl || preview.videoUrl) && (
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black max-h-48">
            {preview.videoUrl?.match(/\.(mp4|webm|mov)/i) ? (
              <video src={preview.videoUrl} poster={preview.thumbnailUrl} controls className="w-full max-h-48 object-contain" />
            ) : (
              <img src={preview.thumbnailUrl || preview.videoUrl} alt="Reel" className="w-full max-h-48 object-cover" />
            )}
          </div>
        )}
        {preview.caption && <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">{preview.caption}</p>}
        <CreatorBlock creator={preview.creator} />
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <span>Reel ID: <AdminIdLink id={preview.id} type="reel" /></span>
          <span>Likes: {preview.likesCount ?? 0}</span>
          <span>Comments: {preview.commentsCount ?? 0}</span>
          <span>{preview.createdAt ? new Date(preview.createdAt).toLocaleString() : ''}</span>
        </div>
      </div>
    );
  }

  if (preview.type === 'post' || targetType === 'post') {
    const img = preview.imageUrl || preview.images?.[0];
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <p className="text-xs font-bold uppercase text-slate-500">Reported Content — Post</p>
        {img && (
          <img src={img} alt="Post" className="w-full max-h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
        )}
        {preview.videoUrl && !img && (
          <video src={preview.videoUrl} controls className="w-full max-h-48 rounded-lg" />
        )}
        {preview.content && <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-4">{preview.content}</p>}
        <CreatorBlock creator={preview.creator} />
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <span>Post ID: <AdminIdLink id={preview.id} type="post" /></span>
          <span>Likes: {preview.likesCount ?? 0}</span>
          <span>Comments: {preview.commentsCount ?? 0}</span>
          <span>{preview.createdAt ? new Date(preview.createdAt).toLocaleString() : ''}</span>
        </div>
      </div>
    );
  }

  if (preview.type === 'comment' || targetType === 'comment') {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <p className="text-xs font-bold uppercase text-slate-500">Reported Content — Comment</p>
        <p className="text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">{preview.text}</p>
        {preview.author && (
          <p className="text-[10px] text-slate-500">
            Author: {preview.author.fullName} ({preview.author.handle}) · ID: <AdminIdLink id={preview.author.id} type="user" />
          </p>
        )}
        <p className="text-[10px] text-slate-500">
          Comment ID: <AdminIdLink id={preview.id} type="comment" meta={{ parentType: preview.parentType, parentId: preview.parentId }} />
        </p>
        {preview.parentPreview && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 mb-1">Related {preview.parentType}</p>
            <ReportTargetPreview preview={preview.parentPreview} targetType={preview.parentType} targetId={preview.parentId} />
          </div>
        )}
      </div>
    );
  }

  if (preview.type === 'message' || targetType === 'message') {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <p className="text-xs font-bold uppercase text-slate-500">Reported Content — Message</p>
        <p className="text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">{preview.text || '(No text)'}</p>
        <div className="text-[10px] text-slate-500 space-y-1">
          <p>Sender: {preview.sender?.fullName} · <AdminIdLink id={preview.sender?.id} type="user" /></p>
          <p>Receiver: {preview.receiver?.fullName} · <AdminIdLink id={preview.receiver?.id} type="user" /></p>
          <p>Message ID: <AdminIdLink id={preview.id} type="message" /></p>
          <p>{preview.createdAt ? new Date(preview.createdAt).toLocaleString() : ''}</p>
        </div>
      </div>
    );
  }

  if (preview.type === 'user' || targetType === 'user') {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <p className="text-xs font-bold uppercase text-slate-500">Reported User</p>
        <div className="flex items-center gap-2">
          <Avatar src={preview.avatar} alt={preview.fullName || preview.username} size="md" />
          <div>
            <p className="text-sm font-bold">{preview.fullName}</p>
            <p className="text-xs text-slate-500">@{preview.username}</p>
            <p className="text-[10px] text-slate-400">User ID: <AdminIdLink id={preview.id} type="user" /></p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ReportTargetPreview;
