import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../api/productApi';
import ProductCard from '../components/product/ProductCard';
import { Filter, SlidersHorizontal, Loader2 } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category') || '';
  const selectedSort = searchParams.get('sortBy') || 'createdAt';
  const selectedOrder = searchParams.get('order') || 'desc';
  const keyword = searchParams.get('keyword') || '';

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          getCategories(),
          getProducts({
            category: selectedCategory || undefined,
            keyword: keyword || undefined,
            sortBy: selectedSort,
            order: selectedOrder,
            limit: 20,
          }),
        ]);
        setCategories(catRes.data || []);
        setProducts(prodRes.data?.products || []);
      } catch (err) {
        console.error('Catalog fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [selectedCategory, selectedSort, selectedOrder, keyword]);

  const handleCategoryChange = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId) {
      newParams.set('category', catId);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (e) => {
    const [sortBy, order] = e.target.value.split(':');
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', sortBy);
    newParams.set('order', order);
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Category Pills Strip */}
      <div className="bg-white p-3 rounded shadow-sm border border-gray-200 mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleCategoryChange('')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
            !selectedCategory
              ? 'bg-[#2874f0] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => handleCategoryChange(cat._id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat._id
                ? 'bg-[#2874f0] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Top Controls Bar */}
        <div className="flex-1">
          <div className="bg-white p-3.5 rounded shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="text-sm text-gray-600 font-medium">
              {keyword && <span>Results for "<span className="text-gray-900 font-bold">{keyword}</span>" — </span>}
              Showing <span className="font-bold text-gray-900">{products.length}</span> products
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Sort By:</span>
              <select
                value={`${selectedSort}:${selectedOrder}`}
                onChange={handleSortChange}
                className="text-xs font-medium border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#2874f0]"
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="price:asc">Price: Low to High</option>
                <option value="price:desc">Price: High to Low</option>
                <option value="ratingsAverage:desc">Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2">
              <Loader2 size={32} className="animate-spin text-[#2874f0]" />
              <span className="text-sm font-medium">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded border border-gray-200 p-12 text-center">
              <p className="text-gray-500 font-medium text-base mb-2">No products found</p>
              <p className="text-gray-400 text-xs">Try adjusting your category or search keyword filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;