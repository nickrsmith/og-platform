import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * List Asset Page - Redirects to Create Listing
 * This page redirects to the create listing flow which is the primary
 * and more comprehensive flow for listing assets.
 */
export default function ListAsset() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to create listing flow
    setLocation("/create-listing");
  }, [setLocation]);

  return null;
}
