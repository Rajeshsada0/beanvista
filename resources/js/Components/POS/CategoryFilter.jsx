import React, { useRef, useState } from 'react';

export default function CategoryFilter({ categories, activeCategory, onSelectCategory }) {
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const dragDistance = useRef(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        startX.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeft.current = scrollRef.current.scrollLeft;
        dragDistance.current = 0;
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5;
        dragDistance.current = Math.abs(e.pageX - (startX.current + scrollRef.current.offsetLeft));
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const handleWheel = (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            scrollRef.current.scrollLeft += e.deltaY;
        }
    };

    return (
        <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            className={`flex space-x-2 overflow-x-auto py-2 scrollbar-hide pb-3 cursor-grab select-none ${
                isDragging ? 'cursor-grabbing' : ''
            }`}
        >
            <button
                onClick={() => {
                    if (dragDistance.current > 5) return;
                    onSelectCategory('all');
                }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    activeCategory === 'all'
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
                All Categories
            </button>
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => {
                        if (dragDistance.current > 5) return;
                        onSelectCategory(category.id);
                    }}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                        String(activeCategory) === String(category.id) || (typeof activeCategory === 'string' && activeCategory.toLowerCase() === category.name.toLowerCase())
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}
