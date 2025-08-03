// AllProducts.jsx
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

const AllProducts = () => {
    const { products, searchQuery, loading } = useAppContext();

    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {

        if (searchQuery && products) {
            if (searchQuery.length > 0) {
                const searchResult = products.filter(product =>
                    product.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setFilteredProducts(searchResult);
            } else {
                setFilteredProducts(products);
            }
        } else if (products) { 
             setFilteredProducts(products);
        }

    }, [products, searchQuery]);


    if (loading) {
        return <div className="text-center mt-16 text-2xl text-gray-600">Loading products...</div>;
    }

    if (!filteredProducts || filteredProducts.length === 0) {
        return (
            <div className='mt-16 flex flex-col items-center'>
                <div className='flex flex-col items-end w-max'>
                    <p className='text-2xl font-medium uppercase'>All Products</p>
                    <div className='w-16 h-0.5 bg-primary rounded-full'></div>
                </div>
                <div className="text-center mt-10 text-lg text-gray-500">No products found.</div>
            </div>
        );
    }

    return (
        <div className='mt-16 flex flex-col'>
            <div className='flex flex-col items-end w-max'>
                <p className='text-2xl font-medium uppercase'>All Products</p>
                <div className='w-16 h-0.5 bg-primary rounded-full'></div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6'>
                {filteredProducts
                    .filter((product) => product.inStock)
                    .map((product, index) => (
                        <ProductCard key={index} product={product} />
                    ))}
            </div>
        </div>
    );
};

export default AllProducts;