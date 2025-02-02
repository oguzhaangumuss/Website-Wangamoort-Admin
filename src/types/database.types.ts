export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          image?: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          image?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          image?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          name: string
          slug: string
          category_id: string
          created_at: string
          image?: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category_id: string
          created_at?: string
          image?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          category_id?: string
          created_at?: string
          image?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          subcategory_id: string
          created_at: string
          default_supplier_id: string | null
          is_recommended: boolean
          subcategory?: Database['public']['Tables']['subcategories']['Row']
          variants?: Database['public']['Tables']['product_variants']['Row'][]
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          subcategory_id: string
          created_at?: string
          default_supplier_id?: string
          is_recommended?: boolean
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          subcategory_id?: string
          created_at?: string
          default_supplier_id?: string
          is_recommended?: boolean
        }
        Relationships: {
          subcategory: {
            References: {
              Table: 'subcategories'
              Columns: ['subcategory_id']
            }
          }
          product_variants: {
            References: {
              Table: 'product_variants'
              Columns: ['product_id']
            }
          }
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          variant_name: string | null
          size: string
          color: string
          price: number
          stock_status: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          variant_name?: string
          size: string
          color: string
          price: number
          stock_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          variant_name?: string
          size?: string
          color?: string
          price?: number
          stock_status?: string
          created_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          variant_id: string
          url: string
          alt: string | null
          created_at: string
          is_default: boolean
        }
        Insert: {
          id?: string
          variant_id: string
          url: string
          alt?: string | null
          created_at?: string
          is_default?: boolean
        }
        Update: {
          id?: string
          variant_id?: string
          url?: string
          alt?: string | null
          created_at?: string
          is_default?: boolean
        }
      }
      quotes: {
        Row: {
          id: string
          case_id: number
          created_at: string
          updated_at: string
          status: string
          company_name: string
          customer_first_name: string
          customer_last_name: string
          customer_email: string
          customer_phone: string
          delivery_address: {
            street: string
            city: string
            state: string
            postcode: string
          }
          is_delivery: boolean
          is_installation: boolean
          is_rubbish_removal: boolean
          notes: string
          basket: Array<{
            product_id: string
            quantity: number
            selected_size: string
            selected_color: string
            price: number
            product_name: string
            variant_name: string
          }>
        }
        Insert: {
          id?: string
          case_id?: number
          created_at?: string
          updated_at?: string
          status?: string
          company_name?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_email?: string
          customer_phone?: string
          delivery_address?: {
            street?: string
            city?: string
            state?: string
            postcode?: string
          }
          is_delivery?: boolean
          is_installation?: boolean
          is_rubbish_removal?: boolean
          notes?: string
          basket?: Array<{
            product_id?: string
            quantity?: number
            selected_size?: string
            selected_color?: string
            price?: number
          }>
        }
        Update: {
          id?: string
          case_id?: number
          updated_at?: string
          status?: string
          company_name?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_email?: string
          customer_phone?: string
          delivery_address?: {
            street?: string
            city?: string
            state?: string
            postcode?: string
          }
          is_delivery?: boolean
          is_installation?: boolean
          is_rubbish_removal?: boolean
          notes?: string
          basket?: Array<{
            product_id?: string
            quantity?: number
            selected_size?: string
            selected_color?: string
            price?: number
          }>
        }
      }
      customers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          company_name?: string
          created_at: string
          updated_at: string
          default_address?: {
            street: string
            city: string
            state: string
            postcode: string
          }
        }
      }
      suppliers: {
        Row: {
          id: string
          company_name: string
          contact_name: string
          email: string
          phone: string
          created_at: string
          updated_at: string
          address: {
            street: string
            city: string
            state: string
            postcode: string
          }
          status: 'active' | 'inactive'
          product_categories?: string[]
          notes?: string
          supplier_code: string
          website_url?: string
        }
      }
      supplier_products: {
        Row: {
          id: string
          supplier_id: string
          product_id: string
          supplier_product_url?: string
          supplier_product_code?: string
          supplier_price: number
          is_active: boolean
          created_at: string
          updated_at: string
          last_checked: string
          notes?: string
        }
        Insert: {
          id?: string
          supplier_id: string
          product_id: string
          supplier_product_url?: string
          supplier_product_code?: string
          supplier_price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_checked?: string
          notes?: string
        }
        Update: {
          supplier_product_url?: string
          supplier_product_code?: string
          supplier_price?: number
          is_active?: boolean
          updated_at?: string
          last_checked?: string
          notes?: string
        }
        Relationships: {
          supplier: {
            References: {
              Table: 'suppliers'
              Columns: ['supplier_id']
            }
          }
          product: {
            References: {
              Table: 'products'
              Columns: ['product_id']
            }
          }
        }
      }
    }
  }
}

export type Category = Database['public']['Tables']['categories']['Row']
export type Subcategory = Database['public']['Tables']['subcategories']['Row'] & {
  category?: Category
}

export type ExtendedProduct = Omit<Database['public']['Tables']['products']['Row'], 'description'> & {
  subcategory?: Subcategory
  variants?: ProductVariant[]
  stock_status: string
  updated_at: string
  description: string
  default_supplier?: Supplier
  is_recommended: boolean
}

export type Product = Database['public']['Tables']['products']['Row'] & {
  subcategory?: Subcategory
  product_variants?: ProductVariant[]
}

export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']

export type QuoteBasketItem = {
  product_id: string
  quantity: number
  selected_size?: string
  selected_color?: string
  price: number
  product_name: string
  variant_name: string
}

export type Quote = Omit<
  Database['public']['Tables']['quotes']['Row'], 
  'company_name' | 'basket' | 'delivery_address' | 'notes'
> & {
  case_id: number
  basket: QuoteBasketItem[]
  company_name?: string
  delivery_address?: {
    street: string
    city: string
    state: string
    postcode: string
  }
  notes?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type SupplierProduct = Database['public']['Tables']['supplier_products']['Row'] & {
  product?: Product
  supplier?: Supplier
}