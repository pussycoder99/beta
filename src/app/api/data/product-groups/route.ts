
import { NextResponse } from 'next/server';
import { getProductGroupsWHMCS, getProductsWHMCS } from '@/lib/whmcs-mock-api';
import type { ProductGroup, Product } from '@/types';

export async function GET(request: Request) {
  console.log('[API /api/data/product-groups] Attempting to fetch product groups/categories.');
  try {
    // First, try the dedicated GetProductGroups API
    const { groups: directGroups, whmcsData: directGroupsWhmcsData } = await getProductGroupsWHMCS();

    if (directGroups.length > 0) {
      console.log(`[API /api/data/product-groups] Successfully fetched ${directGroups.length} groups using GetProductGroups. Sending these to client.`);
      // If GetProductGroups works, the client will fetch products per GID as before.
      // So, we only return the groups here. The frontend will then call /api/data/products?gid=...
      return NextResponse.json({ groups: directGroups, source: 'GetProductGroups', allProducts: null, whmcsData: directGroupsWhmcsData });
    }

    // If GetProductGroups returned no groups (or failed silently), try deriving from GetProducts
    console.log('[API /api/data/product-groups] GetProductGroups returned no groups or failed. Attempting to derive groups from all products via GetProducts.');
    const { products: allProducts, whmcsData: allProductsWhmcsData } = await getProductsWHMCS(); // Fetch ALL products

    if (!allProducts || allProducts.length === 0) {
      console.warn('[API /api/data/product-groups] GetProducts (for all products) also returned no products. Cannot derive groups.');
      return NextResponse.json({ groups: [], products: [], message: 'No products found to derive groups from.', source: 'DerivedFromGetProducts_NoProducts' });
    }

    const derivedGroupMap = new Map<string, ProductGroup>();
    allProducts.forEach(product => {
      if (product.gid && product.groupname) { // Crucially, groupname must be present
        if (!derivedGroupMap.has(product.gid)) {
          derivedGroupMap.set(product.gid, {
            id: product.gid,
            name: product.groupname,
            // headline, tagline, order might not be available here
          });
        }
      } else {
        console.warn(`[API /api/data/product-groups] Product PID ${product.pid} (GID: ${product.gid}) missing groupname while deriving. It will not be part of a named group.`);
      }
    });

    const derivedGroups = Array.from(derivedGroupMap.values());

    if (derivedGroups.length === 0) {
         console.warn('[API /api/data/product-groups] No groups could be derived from products (likely missing groupname in GetProducts response for all products).');
    } else {
        console.log(`[API /api/data/product-groups] Successfully derived ${derivedGroups.length} groups from ${allProducts.length} products. Sending derived groups AND all products to client.`);
    }
    
    // In the derived scenario, we send BOTH derived groups and ALL products
    // The client will use these derived groups for tabs and filter the allProducts list.
    return NextResponse.json({ 
        groups: derivedGroups, 
        allProducts: allProducts, // Send all products so client can filter
        source: 'DerivedFromGetProducts',
        whmcsData: { allProductsWhmcsData } 
    });

  } catch (error) {
    console.error('[API /api/data/product-groups] General Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while fetching product data.';
    // Return an empty array for groups and products in case of a general error to prevent frontend breakage
    return NextResponse.json({ 
        groups: [], 
        allProducts: [], 
        message: errorMessage, 
        errorDetails: String(error),
        source: 'Error' 
    }, { status: 500 });
  }
}
