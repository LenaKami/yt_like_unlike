import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Input} from "../ui"
import {useForm, type SubmitHandler} from "react-hook-form"
import {type RegistrationFormData, validationSchema} from "./types_player"
import {zodResolver} from '@hookform/resolvers/zod'
import { useParams } from 'react-router-dom';
import { useToast } from '../Toast/ToastContext';


type PlayerYT = {
  _id: string,
  linkyt: string,
  category: string
}


export const UpdatePlayerYT = () => {

  const { showToast } = useToast();
  const classinput = "input-color border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
  const classlabel = "block mb-2 text-sm font-medium text-white"

  const [player, setPlayer] = useState<PlayerYT>();
  //const [loading, setLoading] = useState(true);
  const [, setLoading] = useState(true);
    const [url, setUrl] = useState('');
    const {register, handleSubmit, formState:{errors }} = useForm<RegistrationFormData>({
    resolver: zodResolver(validationSchema)
    })
    const { id } = useParams();
    console.log(id, "dcfvghj");
    useEffect(() => {fetchData();
    }, []);

    const fetchData = async () => {
      try {
        const playerYTResponse = await fetch(`http://localhost:5000/player/getPlayer/${id}`);
        const playerYTData = await playerYTResponse.json();
        setPlayer(playerYTData.data);
        console.log(playerYTData.data)
        console.log(player)
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Błąd podczas pobierania danych odtwarzacza', 'error', 3000);
        setLoading(false);
      }
    };
  const handleAddForm: SubmitHandler<RegistrationFormData> = async (data) => {

    console.log(data)
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      showToast('JWT token nie został znaleziony', 'error', 3000);
      throw new Error('JWT token not found in localStorage');
    }
    try {
      const response = await fetch(`http://localhost:5000/player/update/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const dataa = await response.json();
      if (response.ok) {
        showToast(`Success: ${dataa.message}`, 'success', 3000);
        setUrl(data.linkyt);
      } else {
        showToast(`Error: ${dataa.message}`, 'error', 3000);
      }
    } catch (error) {
      showToast('Błąd podczas aktualizacji odtwarzacza', 'error', 3000);
      console.error(error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Odtwarzacz YouTube w React</h1>
          <form onSubmit={handleSubmit(handleAddForm)}>
            <Input label='Link' {...register('linkyt')} defaultValue={player?.linkyt} error={errors.linkyt} inputClassName={classinput} labelClassName={classlabel}/>
            {/*<Input label='Cat' {...register('category')} error={errors.category} inputClassName={classinput} labelClassName={classlabel}/>*/}
            <div><label className={classlabel}>Category</label>
          <select {...register('category')} className={classinput} defaultValue={player?.category}>
            <option value={player?.category}>{player?.category}</option>
            {player?.category != 'POP' ? (<><option value="POP">POP</option></>):(<></>)}
            {player?.category != 'METAL' ? (<><option value="METAL">METAL</option></>):(<></>)}
            {player?.category != 'RAP' ? (<><option value="RAP">RAP</option></>):(<></>)}
            {player?.category != 'ROCK' ? (<><option value="ROCK">ROCK</option></>):(<></>)}
            {player?.category != 'INDIE' ? (<><option value="INDIE">INDIE</option></>):(<></>)}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}</div>
        <button type="submit" style={{ padding: '10px 20px' }} className='log-in'>Odtwórz</button>
        </form>
        {url && (
          <div className="player-wrapper">
            <ReactPlayer
              className="react-player"
              url={url}
              width="100%"
              height="100%"
              controls
            />
          </div>
        )}
      </header>
    </div>
  )
}