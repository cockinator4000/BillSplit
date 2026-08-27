import React, { useState } from 'react';
import { Users, Plus, X, Crown, Check, Sparkles } from 'lucide-react';
import { Friend } from '../types';
import { FRIEND_COLORS, getColorTheme } from '../utils/colors';

interface FriendsManagerProps {
  friends: Friend[];
  onAddFriend: (name: string, colorId?: string) => void;
  onRemoveFriend: (id: string) => void;
  onUpdateFriend: (friend: Friend) => void;
  onSetDefaultPayer: (id: string) => void;
}

export const FriendsManager: React.FC<FriendsManagerProps> = ({
  friends,
  onAddFriend,
  onRemoveFriend,
  onUpdateFriend,
  onSetDefaultPayer,
}) => {
  const [newFriendName, setNewFriendName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState(FRIEND_COLORS[0].id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    onAddFriend(newFriendName.trim(), selectedColor);
    setNewFriendName('');
    // Pick next unused color
    const nextColorIndex = (friends.length + 1) % FRIEND_COLORS.length;
    setSelectedColor(FRIEND_COLORS[nextColorIndex].id);
    setIsAdding(false);
  };

  const startEdit = (friend: Friend) => {
    setEditingId(friend.id);
    setEditName(friend.name);
  };

  const saveEdit = (friend: Friend) => {
    if (editName.trim()) {
      onUpdateFriend({ ...friend, name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleAddDefaultFriends = () => {
    const defaults = [
      { name: 'Alice', color: 'blue' },
      { name: 'Bob', color: 'emerald' },
      { name: 'Charlie', color: 'amber' },
      { name: 'Diana', color: 'rose' },
    ];
    defaults.forEach(d => {
      if (!friends.some(f => f.name.toLowerCase() === d.name.toLowerCase())) {
        onAddFriend(d.name, d.color);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              People Splitting
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {friends.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400">
              Add everyone sharing groceries. Click Crown <Crown className="inline w-3 h-3 text-amber-500 mx-0.5" /> to set default receipt buyer.
            </p>
          </div>
        </div>

        {friends.length <= 1 && (
          <button
            id="btn-quick-add-group"
            onClick={handleAddDefaultFriends}
            className="text-xs font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Add Sample Roommates</span>
          </button>
        )}
      </div>

      {/* Friends Chips List */}
      <div className="flex flex-wrap items-center gap-2.5">
        {friends.map(friend => {
          const theme = getColorTheme(friend.color);
          const isEditing = editingId === friend.id;

          return (
            <div
              key={friend.id}
              className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                friend.isDefaultPayer
                  ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Avatar circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${theme.avatarBg}`}
              >
                {friend.name.charAt(0).toUpperCase()}
              </div>

              {/* Name / Edit input */}
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(friend)}
                    autoFocus
                    className="w-20 px-1.5 py-0.5 text-xs font-medium bg-white dark:bg-slate-900 border border-indigo-500 rounded focus:outline-none"
                  />
                  <button
                    onClick={() => saveEdit(friend)}
                    className="p-0.5 text-indigo-600 hover:text-indigo-700"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(friend)}
                  title="Click to rename"
                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:underline"
                >
                  {friend.name}
                </button>
              )}

              {/* Default Payer Indicator & Toggle */}
              <button
                type="button"
                onClick={() => onSetDefaultPayer(friend.id)}
                title={
                  friend.isDefaultPayer
                    ? `${friend.name} is the default receipt payer`
                    : `Set ${friend.name} as primary receipt payer`
                }
                className={`p-1 rounded transition-colors ${
                  friend.isDefaultPayer
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60'
                    : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
              </button>

              {/* Remove friend button (if more than 1 friend exists) */}
              {friends.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveFriend(friend.id)}
                  title={`Remove ${friend.name}`}
                  className="text-slate-400 hover:text-rose-500 dark:text-slate-500 p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Friend Button or inline form */}
        {!isAdding ? (
          <button
            id="btn-open-add-friend"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Person</span>
          </button>
        ) : (
          <form
            onSubmit={handleAdd}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 shadow-sm"
          >
            {/* Color selector mini dropdown */}
            <div className="flex items-center gap-1">
              {FRIEND_COLORS.slice(0, 5).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-4 h-4 rounded-full ${c.avatarBg} transition-transform ${
                    selectedColor === c.id ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            <input
              id="input-new-friend-name"
              type="text"
              placeholder="Name"
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              autoFocus
              className="w-24 px-2 py-0.5 text-xs rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
            />

            <button
              id="btn-confirm-add-friend"
              type="submit"
              disabled={!newFriendName.trim()}
              className="px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
