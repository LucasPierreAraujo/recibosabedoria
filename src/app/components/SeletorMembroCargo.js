// Componente simplificado para seleção de cargo
// Permite selecionar de uma lista OU digitar manualmente (datalist)

export default function SeletorMembroCargo({
  label,
  value, // { tipo: 'cadastrado'|'manual', membroId: string, nomeManual: string }
  onChange,
  membros = []
}) {
  const handleChange = (e) => {
    const selectedId = e.target.value;

    // Verifica se é um membro cadastrado
    const membroCadastrado = membros.find(m => m.id === selectedId);

    if (membroCadastrado) {
      onChange({ tipo: 'cadastrado', membroId: selectedId, nomeManual: '' });
    } else {
      // É um nome digitado manualmente
      onChange({ tipo: 'manual', membroId: null, nomeManual: selectedId });
    }
  };

  // Valor atual para exibir
  const displayValue = value?.tipo === 'cadastrado'
    ? value.membroId
    : (value?.nomeManual || '');

  return (
    <div className="space-y-1">
      <label className="block text-sm font-bold text-gray-700">{label}</label>
      <input
        list={`membros-${label}`}
        value={displayValue}
        onChange={handleChange}
        placeholder="Selecione ou digite o nome..."
        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900"
      />
      <datalist id={`membros-${label}`}>
        {membros.map(membro => (
          <option key={membro.id} value={membro.id}>
            {membro.nome} {membro.cim ? `- CIM: ${membro.cim}` : ''}
          </option>
        ))}
      </datalist>
    </div>
  );
}
