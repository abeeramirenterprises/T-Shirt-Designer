import React, { useState, useRef } from 'react';
import { Upload, Type, Image as ImageIcon, Trash2, RotateCcw, Download, Palette, Layers, Grid3X3 } from 'lucide-react';
import { cn } from './utils/cn';

// Shirt color options
const SHIRT_COLORS = [
  { name: 'White', value: '#FFFFFF', texture: 'light' },
  { name: 'Black', value: '#1a1a1a', texture: 'dark' },
  { name: 'Navy', value: '#1e3a5f', texture: 'dark' },
  { name: 'Red', value: '#dc2626', texture: 'medium' },
  { name: 'Royal Blue', value: '#2563eb', texture: 'medium' },
  { name: 'Forest Green', value: '#166534', texture: 'medium' },
  { name: 'Purple', value: '#7c3aed', texture: 'medium' },
  { name: 'Gray', value: '#6b7280', texture: 'medium' },
  { name: 'Heather Gray', value: '#9ca3af', texture: 'heather' },
  { name: 'Burgundy', value: '#7f1d1d', texture: 'dark' },
  { name: 'Olive', value: '#657422', texture: 'medium' },
  { name: 'Orange', value: '#ea580c', texture: 'medium' },
];

// Fabric textures
const FABRIC_TEXTURES = [
  { name: 'Cotton', id: 'cotton', description: 'Soft, breathable natural fiber' },
  { name: 'Polyester', id: 'polyester', description: 'Durable, wrinkle-resistant' },
  { name: 'Blend', id: 'blend', description: '50/50 cotton-polyester mix' },
  { name: 'Tri-Blend', id: 'triblend', description: 'Soft, vintage feel' },
];

// Shirt views
const SHIRT_VIEWS = [
  { id: 'front', name: 'Front', icon: '👕' },
  { id: 'back', name: 'Back', icon: '🔄' },
  { id: 'left', name: 'Left Sleeve', icon: '⬅️' },
  { id: 'right', name: 'Right Sleeve', icon: '➡️' },
];

// Print areas for each view
const PRINT_AREAS: Record<string, { x: number; y: number; width: number; height: number }> = {
  front: { x: 180, y: 180, width: 240, height: 300 },
  back: { x: 180, y: 160, width: 240, height: 320 },
  left: { x: 80, y: 200, width: 100, height: 120 },
  right: { x: 420, y: 200, width: 100, height: 120 },
};

interface DesignElement {
  id: string;
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  text?: string;
}

export default function App() {
  const [selectedColor, setSelectedColor] = useState(SHIRT_COLORS[0]);
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TEXTURES[0]);
  const [currentView, setCurrentView] = useState('front');
  const [elements, setElements] = useState<Record<string, DesignElement[]>>({
    front: [],
    back: [],
    left: [],
    right: [],
  });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [showGrid, setShowGrid] = useState(true);
  const [showTexture, setShowTexture] = useState(true);
  const canvasRef = useRef<SVGSVGElement>(null);

  const currentElements = elements[currentView] || [];
  const printArea = PRINT_AREAS[currentView];

  // Generate fabric texture pattern
  const generateTexturePattern = (fabric: string, color: string) => {
    const patterns: Record<string, React.ReactElement> = {
      cotton: (
        <pattern id="cottonTexture" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill={color} />
          <circle cx="1" cy="1" r="0.5" fill={color} opacity="0.3" />
          <circle cx="3" cy="3" r="0.5" fill={color} opacity="0.3" />
        </pattern>
      ),
      polyester: (
        <pattern id="polyesterTexture" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill={color} />
          <path d="M0 4 L8 4 M4 0 L4 8" stroke={color} strokeWidth="0.5" opacity="0.2" />
        </pattern>
      ),
      blend: (
        <pattern id="blendTexture" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill={color} />
          <circle cx="2" cy="2" r="1" fill={color} opacity="0.25" />
          <circle cx="4" cy="4" r="1" fill={color} opacity="0.25" />
        </pattern>
      ),
      triblend: (
        <pattern id="triblendTexture" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill={color} />
          <circle cx="3" cy="3" r="1.5" fill={color} opacity="0.2" />
          <circle cx="7" cy="7" r="1.5" fill={color} opacity="0.2" />
          <circle cx="3" cy="7" r="1" fill={color} opacity="0.15" />
          <circle cx="7" cy="3" r="1" fill={color} opacity="0.15" />
        </pattern>
      ),
    };
    return patterns[fabric] || patterns.cotton;
  };

  // Handle element selection
  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  };

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = currentElements.find(el => el.id === elementId);
    if (element) {
      setDraggingElement(elementId);
      setSelectedElement(elementId);
      const svgRect = canvasRef.current?.getBoundingClientRect();
      if (svgRect) {
        setDragOffset({
          x: e.clientX - svgRect.left - element.x,
          y: e.clientY - svgRect.top - element.y,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingElement && canvasRef.current) {
      const svgRect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - svgRect.left - dragOffset.x;
      const newY = e.clientY - svgRect.top - dragOffset.y;
      
      setElements(prev => ({
        ...prev,
        [currentView]: prev[currentView].map(el =>
          el.id === draggingElement
            ? { ...el, x: newX, y: newY }
            : el
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  // Add text element
  const addText = () => {
    if (!textInput.trim()) return;
    const newElement: DesignElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: textInput,
      x: printArea.x + printArea.width / 2 - 50,
      y: printArea.y + printArea.height / 2 - 15,
      width: 100,
      height: 30,
      rotation: 0,
      fontSize,
      color: textColor,
      text: textInput,
    };
    setElements(prev => ({
      ...prev,
      [currentView]: [...prev[currentView], newElement],
    }));
    setTextInput('');
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newElement: DesignElement = {
          id: `image-${Date.now()}`,
          type: 'image',
          content: event.target?.result as string,
          x: printArea.x + printArea.width / 2 - 50,
          y: printArea.y + printArea.height / 2 - 50,
          width: 100,
          height: 100,
          rotation: 0,
        };
        setElements(prev => ({
          ...prev,
          [currentView]: [...prev[currentView], newElement],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    setElements(prev => ({
      ...prev,
      [currentView]: prev[currentView].filter(el => el.id !== elementId),
    }));
    setSelectedElement(null);
  };

  // Rotate element
  const rotateElement = (elementId: string) => {
    setElements(prev => ({
      ...prev,
      [currentView]: prev[currentView].map(el =>
        el.id === elementId ? { ...el, rotation: (el.rotation + 90) % 360 } : el
      ),
    }));
  };

  // Clear all elements for current view
  const clearView = () => {
    setElements(prev => ({
      ...prev,
      [currentView]: [],
    }));
    setSelectedElement(null);
  };

  // Export design
  const exportDesign = () => {
    alert('Design exported! In a production app, this would generate a high-resolution PNG.');
  };

  // Get shirt path based on view
  const getShirtPath = () => {
    const baseColor = `url(#${selectedFabric.id}Texture)`;
    
    switch (currentView) {
      case 'front':
        return (
          <>
            {/* Front view - body */}
            <path
              d="M 200 100 L 200 150 L 150 170 L 150 220 L 180 230 L 180 500 L 420 500 L 420 230 L 450 220 L 450 170 L 400 150 L 400 100 Z"
              fill={baseColor}
              stroke="#000"
              strokeWidth="2"
            />
            {/* Neckline */}
            <ellipse cx="300" cy="100" rx="40" ry="30" fill={selectedColor.value} />
            {/* Sleeves */}
            <path d="M 150 170 L 80 200 L 80 280 L 150 250 Z" fill={baseColor} stroke="#000" strokeWidth="2" />
            <path d="M 450 170 L 520 200 L 520 280 L 450 250 Z" fill={baseColor} stroke="#000" strokeWidth="2" />
          </>
        );
      case 'back':
        return (
          <>
            {/* Back view - body */}
            <path
              d="M 200 90 L 200 140 L 150 160 L 150 210 L 180 220 L 180 500 L 420 500 L 420 220 L 450 210 L 450 160 L 400 140 L 400 90 Z"
              fill={baseColor}
              stroke="#000"
              strokeWidth="2"
            />
            {/* Back neckline */}
            <path d="M 260 90 Q 300 110 340 90" fill="none" stroke="#000" strokeWidth="2" />
            {/* Sleeves */}
            <path d="M 150 160 L 80 190 L 80 270 L 150 240 Z" fill={baseColor} stroke="#000" strokeWidth="2" />
            <path d="M 450 160 L 520 190 L 520 270 L 450 240 Z" fill={baseColor} stroke="#000" strokeWidth="2" />
          </>
        );
      case 'left':
        return (
          <>
            {/* Left sleeve view */}
            <path
              d="M 200 150 L 200 200 L 100 250 L 100 350 L 150 380 L 200 350 L 200 400 L 400 400 L 400 350 L 450 380 L 500 350 L 500 250 L 400 200 L 400 150 Z"
              fill={baseColor}
              stroke="#000"
              strokeWidth="2"
            />
            {/* Neckline partial */}
            <path d="M 200 150 Q 300 180 400 150" fill="none" stroke="#000" strokeWidth="2" />
          </>
        );
      case 'right':
        return (
          <>
            {/* Right sleeve view (mirrored) */}
            <path
              d="M 200 150 L 200 200 L 100 250 L 100 350 L 150 380 L 200 350 L 200 400 L 400 400 L 400 350 L 450 380 L 500 350 L 500 250 L 400 200 L 400 150 Z"
              fill={baseColor}
              stroke="#000"
              strokeWidth="2"
            />
            <path d="M 200 150 Q 300 180 400 150" fill="none" stroke="#000" strokeWidth="2" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-xl">👕</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">T-Shirt Designer</h1>
                <p className="text-sm text-gray-400">Create your custom apparel</p>
              </div>
            </div>
            <button
              onClick={exportDesign}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              <Download size={18} />
              Export Design
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Color Picker */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="text-purple-400" size={20} />
                <h3 className="text-white font-semibold">Shirt Color</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SHIRT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-full aspect-square rounded-lg border-2 transition-all',
                      selectedColor.name === color.name
                        ? 'border-white scale-110'
                        : 'border-transparent hover:border-white/50'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">Selected: {selectedColor.name}</p>
            </div>

            {/* Fabric Texture */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="text-purple-400" size={20} />
                <h3 className="text-white font-semibold">Fabric Type</h3>
              </div>
              <div className="space-y-2">
                {FABRIC_TEXTURES.map((fabric) => (
                  <button
                    key={fabric.id}
                    onClick={() => setSelectedFabric(fabric)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-all',
                      selectedFabric.id === fabric.id
                        ? 'bg-purple-500/30 border border-purple-400'
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                    )}
                  >
                    <p className="text-white font-medium">{fabric.name}</p>
                    <p className="text-xs text-gray-400">{fabric.description}</p>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={showTexture}
                  onChange={(e) => setShowTexture(e.target.checked)}
                  className="rounded"
                />
                Show texture preview
              </label>
            </div>

            {/* Add Text */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Type className="text-purple-400" size={20} />
                <h3 className="text-white font-semibold">Add Text</h3>
              </div>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your text..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
              />
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  min="12"
                  max="72"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <button
                onClick={addText}
                disabled={!textInput.trim()}
                className="w-full mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Text
              </button>
            </div>

            {/* Upload Image */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="text-purple-400" size={20} />
                <h3 className="text-white font-semibold">Upload Image</h3>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-purple-400 transition-all">
                <Upload className="text-gray-400 mb-2" size={24} />
                <span className="text-sm text-gray-400">Click to upload</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            {/* View Options */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Grid3X3 className="text-purple-400" size={20} />
                <h3 className="text-white font-semibold">View Options</h3>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded"
                />
                Show print area grid
              </label>
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              {/* View Selector */}
              <div className="flex justify-center gap-2 mb-6">
                {SHIRT_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      setCurrentView(view.id);
                      setSelectedElement(null);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                      currentView === view.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    )}
                  >
                    <span>{view.icon}</span>
                    <span className="hidden sm:inline">{view.name}</span>
                  </button>
                ))}
              </div>

              {/* Canvas */}
              <div className="flex justify-center">
                <svg
                  ref={canvasRef}
                  width="600"
                  height="550"
                  viewBox="0 0 600 550"
                  className="bg-white rounded-lg shadow-2xl"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={() => setSelectedElement(null)}
                >
                  <defs>
                    {generateTexturePattern(selectedFabric.id, selectedColor.value)}
                    {/* Print area pattern */}
                    <pattern id="gridPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(147, 51, 234, 0.3)" strokeWidth="1" />
                    </pattern>
                  </defs>

                  {/* Shirt base */}
                  {getShirtPath()}

                  {/* Print area */}
                  {showGrid && (
                    <g>
                      <rect
                        x={printArea.x}
                        y={printArea.y}
                        width={printArea.width}
                        height={printArea.height}
                        fill="url(#gridPattern)"
                        stroke="rgba(147, 51, 234, 0.5)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        rx="4"
                      />
                      <text
                        x={printArea.x + printArea.width / 2}
                        y={printArea.y - 10}
                        textAnchor="middle"
                        className="text-xs fill-purple-400"
                      >
                        Print Area
                      </text>
                    </g>
                  )}

                  {/* Design elements */}
                  {currentElements.map((element) => (
                    <g
                      key={element.id}
                      transform={`translate(${element.x}, ${element.y}) rotate(${element.rotation}, ${element.width / 2}, ${element.height / 2})`}
                      onMouseDown={(e) => handleMouseDown(e, element.id)}
                      onClick={(e) => handleElementClick(e, element.id)}
                      className="cursor-move"
                    >
                      {element.type === 'text' ? (
                        <text
                          x={0}
                          y={element.fontSize || 24}
                          fontSize={element.fontSize}
                          fill={element.color}
                          fontFamily="Arial, sans-serif"
                          fontWeight="bold"
                          style={{ userSelect: 'none' }}
                        >
                          {element.content}
                        </text>
                      ) : (
                        <image
                          href={element.content}
                          width={element.width}
                          height={element.height}
                          style={{ userSelect: 'none' }}
                        />
                      )}
                      {/* Selection indicator */}
                      {selectedElement === element.id && (
                        <rect
                          x={-5}
                          y={-5}
                          width={element.width + 10}
                          height={element.height + 10}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          rx="4"
                        />
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {/* Element controls */}
              {selectedElement && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => rotateElement(selectedElement)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                  >
                    <RotateCcw size={16} />
                    Rotate
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-all"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}

              {/* Clear view button */}
              {currentElements.length > 0 && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={clearView}
                    className="text-sm text-gray-400 hover:text-white transition-all"
                  >
                    Clear {SHIRT_VIEWS.find(v => v.id === currentView)?.name} design
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Design Elements List */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 sticky top-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="text-purple-400" size={20} />
                <h3 className="text-white font-semibold">Design Elements</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                {SHIRT_VIEWS.find(v => v.id === currentView)?.name} view
              </p>
              
              {currentElements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No elements yet</p>
                  <p className="text-sm">Add text or upload an image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentElements.map((element, index) => (
                    <div
                      key={element.id}
                      onClick={() => setSelectedElement(element.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                        selectedElement === element.id
                          ? 'bg-purple-500/30 border border-purple-400'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      )}
                    >
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                        {element.type === 'text' ? (
                          <Type size={16} className="text-white" />
                        ) : (
                          <ImageIcon size={16} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          {element.type === 'text' ? element.content : 'Image'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {element.type === 'text' ? `Font: ${element.fontSize}px` : `${element.width}x${element.height}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Color info */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-white font-medium mb-2">Current Selection</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shirt Color:</span>
                    <span className="text-white">{selectedColor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fabric:</span>
                    <span className="text-white">{selectedFabric.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">View:</span>
                    <span className="text-white">{SHIRT_VIEWS.find(v => v.id === currentView)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Elements:</span>
                    <span className="text-white">{currentElements.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick tips */}
              <div className="mt-6 p-3 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <h4 className="text-purple-300 font-medium text-sm mb-2">💡 Tips</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Drag elements to reposition</li>
                  <li>• Click to select an element</li>
                  <li>• Use Rotate to change orientation</li>
                  <li>• Switch views to design all sides</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
