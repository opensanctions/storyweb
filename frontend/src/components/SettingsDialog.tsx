import { Checkbox, Classes, Dialog, Label } from "@blueprintjs/core";
import { FormEvent } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { setHiddenNodeTypes } from "../services/config";
import { useFetchOntologyQuery } from "../services/ontology";
import { RootState } from "../store";
import { IClusterType } from "../types";
import { listToggle } from "../util";

type SettingsDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { data: ontology } = useFetchOntologyQuery();
  const hiddenNodeTypes = useSelector((state: RootState) => state.config.hiddenNodeTypes);
  const dispatch = useDispatch();

  const onChangeNodeType = (e: FormEvent<HTMLInputElement>, type: IClusterType) => {
    const updated = listToggle(hiddenNodeTypes, type.name);
    dispatch(setHiddenNodeTypes(updated));
  }

  if (ontology === undefined) {
    return null;
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Settings">
      <div className={Classes.DIALOG_BODY}>
        <div>
          <Label>Include the following node types in listings:</Label>
          {ontology.cluster_types.map((ct) =>
            <Checkbox
              key={ct.name}
              label={ct.label}
              checked={hiddenNodeTypes.indexOf(ct.name) === -1}
              onChange={(e) => onChangeNodeType(e, ct)}
            />
          )}
        </div>
      </div>
    </Dialog>
  )
}