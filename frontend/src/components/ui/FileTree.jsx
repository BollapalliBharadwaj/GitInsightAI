import React, { useState, useMemo } from 'react'
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, FileText, Code, FileJson, Image } from 'lucide-react'

// Helper to convert GitHub's flat tree array into a nested object
function buildTree(flatTree) {
  const root = { name: 'root', type: 'tree', children: {} }

  for (const item of flatTree) {
    const parts = item.path.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!current.children[part]) {
        const isFile = i === parts.length - 1 && item.type === 'blob'
        current.children[part] = {
          name: part,
          type: isFile ? 'blob' : 'tree',
          path: parts.slice(0, i + 1).join('/'),
          children: {}
        }
      }
      current = current.children[part]
    }
  }

  return root
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  switch (ext) {
    case 'md':
    case 'txt':
      return <FileText size={14} className="text-surface-400" />
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'go':
    case 'rs':
    case 'c':
    case 'cpp':
    case 'html':
    case 'css':
      return <Code size={14} className="text-primary-400" />
    case 'json':
      return <FileJson size={14} className="text-accent-orange" />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
      return <Image size={14} className="text-accent-purple" />
    default:
      return <File size={14} className="text-surface-500" />
  }
}

function TreeNode({ node, level = 0 }) {
  const [isOpen, setIsOpen] = useState(false)
  const isDir = node.type === 'tree'

  // Sort: Directories first, then alphabetical
  const children = useMemo(() => {
    return Object.values(node.children || {}).sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'tree' ? -1 : 1
    })
  }, [node.children])

  if (node.name === 'root') {
    return (
      <div className="text-sm font-mono text-surface-300">
        {children.map(child => (
          <TreeNode key={child.path} node={child} level={level} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded hover:bg-white/[0.05] cursor-pointer transition-colors ${
          isDir ? 'text-surface-200' : 'text-surface-400 hover:text-white'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => isDir && setIsOpen(!isOpen)}
      >
        {isDir ? (
          <span className="flex items-center gap-1">
            {isOpen ? <ChevronDown size={14} className="text-surface-500" /> : <ChevronRight size={14} className="text-surface-500" />}
            {isOpen ? <FolderOpen size={14} className="text-accent-cyan" /> : <Folder size={14} className="text-accent-cyan" />}
          </span>
        ) : (
          <span className="flex items-center gap-1 pl-4">
            {getFileIcon(node.name)}
          </span>
        )}
        <span className="text-xs">{node.name}</span>
      </div>

      {isDir && isOpen && (
        <div>
          {children.map(child => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileTree({ treeData }) {
  const root = useMemo(() => buildTree(treeData || []), [treeData])

  if (!treeData || treeData.length === 0) {
    return <div className="p-4 text-xs text-surface-500 text-center">No files found</div>
  }

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden flex flex-col max-h-[600px]">
      <div className="px-4 py-3 border-b border-surface-800 bg-surface-900/50">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Repository Files</h3>
      </div>
      <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
        <TreeNode node={root} />
      </div>
    </div>
  )
}
