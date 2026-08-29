import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/*
 * The brand shown beside the NL wordmark while a detail page is open.
 *
 * The nav can't work this out on its own: it only ever sees the URL, and the
 * brand lives on the project doc, which is fetched by the detail route. Rather
 * than have the nav re-run that Firestore query (a second read of a document
 * the page already holds), the detail page publishes the brand it loaded and
 * the nav reads it.
 *
 * Deliberately NOT folded into DetailTransitionContext — that context's value
 * is the start-transition function itself, and widening it to an object would
 * touch every caller for something unrelated to the transition.
 */
const DetailBrandContext = createContext({ brand: null, setBrand: () => {} });

export const DetailBrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(null);
  const value = useMemo(() => ({ brand, setBrand }), [brand]);
  return (
    <DetailBrandContext.Provider value={value}>
      {children}
    </DetailBrandContext.Provider>
  );
};

/** Read the current detail brand (nav side). */
export const useDetailBrand = () => useContext(DetailBrandContext).brand;

/*
 * Publish a brand for as long as this component is mounted (page side).
 *
 * Clears on unmount so leaving a detail page — by the back orb, the X, or the
 * browser's own back button — always takes the logo with it, rather than
 * leaving a stale brand next to the wordmark on the wall.
 */
export const usePublishDetailBrand = (brand) => {
  const { setBrand } = useContext(DetailBrandContext);
  useEffect(() => {
    setBrand(brand || null);
    return () => setBrand(null);
  }, [brand, setBrand]);
};

export default DetailBrandContext;
