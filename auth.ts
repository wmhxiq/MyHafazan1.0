import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword } from '@/lib/password'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        id: { label: 'ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        const { id, password, role } = credentials as {
          id: string
          password: string
          role: string
        }

        if (role === 'waris') {
          // Waris — just check if IDPelajar exists
          const { data, error } = await supabase
            .from('Pelajar')
            .select('IDPelajar, NamaPelajar')
            .eq('IDPelajar', id)
            .single()

          if (error || !data) return null

          return {
            id: String(data.IDPelajar),
            name: data.NamaPelajar,
            role: 'waris',
          }
        } else {
          // Staf — check IDGuru + KataLaluan
          const { data, error } = await supabase
            .from('Staf')
            .select('IDGuru, NamaGuru, Peranan, KataLaluan')
            .eq('IDGuru', id)
            .single()

          if (error || !data) return null

          // ✅ Use bcrypt to verify instead of plain text comparison
          const isValid = await verifyPassword(password, data.KataLaluan)
          if (!isValid) return null

          //if (data.KataLaluan !== password) return null

          return {
            id: String(data.IDGuru),
            name: data.NamaGuru,
            role: data.Peranan === 'Pentadbir' ? 'admin' : 'guru',
          }
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      ;(session.user as any).role = token.role
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})