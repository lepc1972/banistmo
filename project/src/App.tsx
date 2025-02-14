import React, { useState, useEffect } from 'react';
import { PawPrint as Paw, Upload, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';

interface Pet {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
}

function App() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchPets();
    }
  }, [session]);

  async function fetchPets() {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching pets');
    } else {
      setPets(data || []);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!session) {
      toast.error('Please sign in first');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const petName = prompt('What is your pet\'s name?');
    if (!petName) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pets')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('pets')
        .insert([
          {
            name: petName,
            image_url: publicUrl,
            user_id: session.user.id,
          },
        ]);

      if (dbError) throw dbError;

      toast.success('Pet uploaded successfully!');
      fetchPets();
    } catch (error) {
      toast.error('Error uploading pet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email: prompt('Email:') || '',
      password: prompt('Password:') || '',
    });

    if (error) toast.error(error.message);
  }

  async function handleSignUp() {
    const email = prompt('Email:');
    const password = prompt('Password:');
    
    if (!email || !password) return;

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) toast.error(error.message);
    else toast.success('Check your email to confirm your account!');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Paw className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">PetBook</span>
            </div>
            <div>
              {session ? (
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              ) : (
                <div className="space-x-4">
                  <button
                    onClick={handleSignIn}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignUp}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {session ? (
          <>
            <div className="mb-8">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600">
                <Upload className="h-5 w-5 mr-2" />
                Upload Pet Photo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={loading}
                />
              </label>
            </div>

            {loading && (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <img
                    src={pet.image_url}
                    alt={pet.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {pet.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(pet.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to PetBook
            </h2>
            <p className="mt-2 text-gray-600">
              Sign in to start sharing photos of your pets!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;